const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const role    = require('../middleware/roleMiddleware');
const {
  getWeatherAlert,
  getForecast,
  getAllAlerts,
  createAlert,
  deleteAlert,
} = require('../controllers/alertController');

router.get('/weather',  auth, getWeatherAlert);
router.get('/forecast', auth, getForecast);
router.get('/',         auth, getAllAlerts);
router.post('/',        auth, role('admin'), createAlert);
router.delete('/:id',   auth, role('admin'), deleteAlert);

module.exports = router;