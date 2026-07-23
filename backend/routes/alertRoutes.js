const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken, allowRoles } = require('../middleware/auth');

router.get('/', verifyToken, allowRoles('staff'), alertController.getActiveAlerts);
router.patch('/:id/resolve', verifyToken, allowRoles('staff'), alertController.resolveAlert);
router.post('/fall', verifyToken, allowRoles('staff'), alertController.triggerFallAlert);

module.exports = router;