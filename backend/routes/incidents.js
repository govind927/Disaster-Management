const express  = require('express');
const router   = express.Router();
const upload   = require('../config/multer');
const auth     = require('../middleware/authMiddleware');
const role     = require('../middleware/roleMiddleware');
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateStatus,
  getMyIncidents,
} = require('../controllers/incidentController');

router.get('/',          auth, getAllIncidents);
router.get('/my',        auth, getMyIncidents);
router.get('/:id',       auth, getIncidentById);
router.post('/',         auth, upload.single('image'), createIncident);
router.put('/:id/status', auth, role('admin'), updateStatus);

module.exports = router;