const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const role    = require('../middleware/roleMiddleware');
const {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
  assignResource,
  releaseResource,
  getIncidentAssignments,
} = require('../controllers/resourceController');

router.get('/',                          auth, getAllResources);
router.post('/',                         auth, role('admin'), createResource);
router.put('/:id',                       auth, role('admin'), updateResource);
router.delete('/:id',                    auth, role('admin'), deleteResource);
router.post('/assign',                   auth, role('admin'), assignResource);
router.post('/release/:id',              auth, role('admin'), releaseResource);
router.get('/assignments/:incident_id',  auth, getIncidentAssignments);

module.exports = router;