const pool = require('../config/db');

// GET /api/resources
exports.getAllResources = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*,
        (SELECT COUNT(*) FROM resource_assignments ra
         WHERE ra.resource_id = r.id AND ra.released_at IS NULL) as active_assignments
       FROM resources r
       ORDER BY r.type, r.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/resources — admin creates resource
exports.createResource = async (req, res) => {
  const { name, type, quantity, lat, lng } = req.body;
  if (!name || !type)
    return res.status(400).json({ message: 'Name and type are required' });
  try {
    const [result] = await pool.execute(
      `INSERT INTO resources (name, type, quantity, status, lat, lng)
       VALUES (?,?,?,?,?,?)`,
      [name, type, quantity || 1, 'available', lat || null, lng || null]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM resources WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/resources/:id — admin updates resource
exports.updateResource = async (req, res) => {
  const { name, type, quantity, status, lat, lng } = req.body;
  try {
    await pool.execute(
      `UPDATE resources SET name=?, type=?, quantity=?, status=?, lat=?, lng=?
       WHERE id=?`,
      [name, type, quantity, status, lat || null, lng || null, req.params.id]
    );
    const [rows] = await pool.execute(
      'SELECT * FROM resources WHERE id = ?', [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/resources/:id
exports.deleteResource = async (req, res) => {
  try {
    await pool.execute('DELETE FROM resources WHERE id = ?', [req.params.id]);
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/resources/assign — assign resource to incident
exports.assignResource = async (req, res) => {
  const { incident_id, resource_id } = req.body;
  if (!incident_id || !resource_id)
    return res.status(400).json({ message: 'incident_id and resource_id are required' });
  try {
    // Check resource is available
    const [resource] = await pool.execute(
      'SELECT * FROM resources WHERE id = ?', [resource_id]
    );
    if (!resource.length)
      return res.status(404).json({ message: 'Resource not found' });
    if (resource[0].status === 'deployed')
      return res.status(400).json({ message: 'Resource already deployed' });

    // Create assignment
    await pool.execute(
      `INSERT INTO resource_assignments (incident_id, resource_id, assigned_by)
       VALUES (?,?,?)`,
      [incident_id, resource_id, req.user.id]
    );

    // Mark resource as deployed
    await pool.execute(
      'UPDATE resources SET status = ? WHERE id = ?',
      ['deployed', resource_id]
    );

    // Emit real-time update
    req.app.get('io').emit('resource_assigned', { incident_id, resource_id });

    res.json({ message: 'Resource assigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/resources/release/:assignment_id
exports.releaseResource = async (req, res) => {
  try {
    const [assignment] = await pool.execute(
      'SELECT * FROM resource_assignments WHERE id = ?', [req.params.id]
    );
    if (!assignment.length)
      return res.status(404).json({ message: 'Assignment not found' });

    await pool.execute(
      'UPDATE resource_assignments SET released_at = NOW() WHERE id = ?',
      [req.params.id]
    );
    await pool.execute(
      'UPDATE resources SET status = ? WHERE id = ?',
      ['available', assignment[0].resource_id]
    );

    req.app.get('io').emit('resource_released', {
      resource_id: assignment[0].resource_id
    });

    res.json({ message: 'Resource released successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/resources/assignments/:incident_id
exports.getIncidentAssignments = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ra.*, r.name, r.type, r.quantity,
              u.name as assigned_by_name
       FROM resource_assignments ra
       JOIN resources r ON ra.resource_id = r.id
       JOIN users u ON ra.assigned_by = u.id
       WHERE ra.incident_id = ? AND ra.released_at IS NULL`,
      [req.params.incident_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};