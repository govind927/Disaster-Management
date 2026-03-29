const pool       = require('../config/db');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper — upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'disaster-mgmt',
        transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// POST /api/incidents
exports.createIncident = async (req, res) => {
  const { title, description, type, severity, lat, lng } = req.body;

  if (!title || !type || !lat || !lng)
    return res.status(400).json({ message: 'Title, type, lat and lng are required' });

  try {
    let image_url = null;
    if (req.file) {
      image_url = await uploadToCloudinary(req.file.buffer);
    }

    const [result] = await pool.execute(
      `INSERT INTO incidents (user_id, title, description, type, severity, lat, lng, image_url)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, title, description || null, type, severity || 'medium', lat, lng, image_url]
    );

    const [rows] = await pool.execute(
      `SELECT i.*, u.name as reporter_name
       FROM incidents i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [result.insertId]
    );

    req.app.get('io').emit('new_incident', rows[0]);
    res.status(201).json({ message: 'Incident reported successfully', incident: rows[0] });
  } catch (err) {
    console.error('Create incident error:', err);
    res.status(500).json({ message: 'Server error while creating incident' });
  }
};

// GET /api/incidents
exports.getAllIncidents = async (req, res) => {
  try {
    const { type, severity, status } = req.query;
    let query = `SELECT i.*, u.name as reporter_name
                 FROM incidents i
                 JOIN users u ON i.user_id = u.id
                 WHERE 1=1`;
    const params = [];
    if (type)     { query += ' AND i.type = ?';     params.push(type); }
    if (severity) { query += ' AND i.severity = ?'; params.push(severity); }
    if (status)   { query += ' AND i.status = ?';   params.push(status); }
    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/incidents/my
exports.getMyIncidents = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM incidents WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/incidents/:id
exports.getIncidentById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT i.*, u.name as reporter_name
       FROM incidents i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Incident not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/incidents/:id/status
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'active', 'resolved'];
  if (!valid.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    const [result] = await pool.execute(
      'UPDATE incidents SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ message: 'Incident not found' });
    req.app.get('io').emit('incident_updated', { id: Number(req.params.id), status });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};