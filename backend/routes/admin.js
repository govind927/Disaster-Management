const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const role    = require('../middleware/roleMiddleware');
const {
  getStats,
  getAllIncidents,
  getAllUsers,
  updateUserRole,
} = require('../controllers/adminController');

router.get('/stats',            auth, role('admin'), getStats);
router.get('/incidents',        auth, role('admin'), getAllIncidents);
router.get('/users',            auth, role('admin'), getAllUsers);
router.put('/users/:id/role',   auth, role('admin'), updateUserRole);

module.exports = router;