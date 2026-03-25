const pool = require('../config/db');

// GET /api/admin/stats — dashboard summary numbers
exports.getStats = async (req, res) => {
  try {
    const [[{ total_incidents }]]   = await pool.execute('SELECT COUNT(*) as total_incidents FROM incidents');
    const [[{ pending }]]           = await pool.execute("SELECT COUNT(*) as pending FROM incidents WHERE status='pending'");
    const [[{ active }]]            = await pool.execute("SELECT COUNT(*) as active FROM incidents WHERE status='active'");
    const [[{ resolved }]]          = await pool.execute("SELECT COUNT(*) as resolved FROM incidents WHERE status='resolved'");
    const [[{ total_users }]]       = await pool.execute('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_resources }]]   = await pool.execute('SELECT COUNT(*) as total_resources FROM resources');
    const [[{ deployed_resources }]]= await pool.execute("SELECT COUNT(*) as deployed_resources FROM resources WHERE status='deployed'");
    const [[{ active_alerts }]]     = await pool.execute("SELECT COUNT(*) as active_alerts FROM alerts WHERE expires_at > NOW()");

    res.json({
      incidents: { total: total_incidents, pending, active, resolved },
      users:     { total: total_users },
      resources: { total: total_resources, deployed: deployed_resources, available: total_resources - deployed_resources },
      alerts:    { active: active_alerts },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/incidents — all incidents with full details
exports.getAllIncidents = async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    let query = `SELECT i.*, u.name as reporter_name, u.phone as reporter_phone,
                   u.email as reporter_email
                 FROM incidents i
                 JOIN users u ON i.user_id = u.id
                 WHERE 1=1`;
    const params = [];
    if (status)   { query += ' AND i.status = ?';   params.push(status); }
    if (severity) { query += ' AND i.severity = ?'; params.push(severity); }
    if (type)     { query += ' AND i.type = ?';     params.push(type); }
    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, role, phone, created_at,
        (SELECT COUNT(*) FROM incidents WHERE user_id = users.id) as incident_count
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!['citizen', 'admin'].includes(role))
    return res.status(400).json({ message: 'Invalid role' });
  try {
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};