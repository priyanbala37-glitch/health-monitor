const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, vitalsController.logVitals);
router.get('/:residentId', verifyToken, vitalsController.getVitalsByResident);

module.exports = router;