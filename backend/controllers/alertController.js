const pool          = require('../config/db');
const weatherService = require('../services/weatherService');

// GET /api/alerts/weather?lat=xx&lng=xx
exports.getWeatherAlert = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng)
    return res.status(400).json({ message: 'lat and lng are required' });
  try {
    const result = await weatherService.getWeatherAlert(lat, lng);

    // Auto-save dangerous alerts to DB
    if (result.alert) {
      await pool.execute(
        `INSERT INTO alerts (title, message, severity, source, lat, lng, radius_km, expires_at)
         VALUES (?,?,?,?,?,?,?, DATE_ADD(NOW(), INTERVAL 6 HOUR))`,
        [
          result.alert.title,
          result.alert.message,
          result.alert.severity,
          result.alert.source,
          result.alert.lat,
          result.alert.lng,
          50,
        ]
      );
    }

    res.json(result);
  } catch (err) {
    console.error('Weather alert error:', err.message);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
};

// GET /api/alerts/forecast?lat=xx&lng=xx
exports.getForecast = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng)
    return res.status(400).json({ message: 'lat and lng are required' });
  try {
    const forecast = await weatherService.getForecast(lat, lng);
    res.json(forecast);
  } catch (err) {
    console.error('Forecast error:', err.message);
    res.status(500).json({ message: 'Failed to fetch forecast' });
  }
};

// GET /api/alerts — get all saved alerts from DB
exports.getAllAlerts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM alerts
       WHERE expires_at > NOW() OR expires_at IS NULL
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/alerts — admin creates manual alert
exports.createAlert = async (req, res) => {
  const { title, message, severity, lat, lng, radius_km } = req.body;
  if (!title || !severity)
    return res.status(400).json({ message: 'Title and severity are required' });
  try {
    const [result] = await pool.execute(
      `INSERT INTO alerts (title, message, severity, source, lat, lng, radius_km, expires_at)
       VALUES (?,?,?,'Manual',?,?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [title, message || '', severity, lat || null, lng || null, radius_km || 50]
    );
    const [rows] = await pool.execute('SELECT * FROM alerts WHERE id = ?', [result.insertId]);

    // Broadcast to all connected clients
    req.app.get('io').emit('new_alert', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/alerts/:id — admin deletes alert
exports.deleteAlert = async (req, res) => {
  try {
    await pool.execute('DELETE FROM alerts WHERE id = ?', [req.params.id]);
    req.app.get('io').emit('alert_deleted', { id: Number(req.params.id) });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};