const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const { verifyToken, allowRoles } = require('../middleware/auth');

router.post('/', verifyToken, allowRoles('staff'), residentController.addResident);
router.get('/', verifyToken, residentController.getAllResidents);
router.get('/:id', verifyToken, residentController.getResidentById);
router.patch('/:id', verifyToken, allowRoles('staff'), residentController.updateResident);

module.exports = router;