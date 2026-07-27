const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { verifyToken, allowRoles } = require('../middleware/auth');

router.post('/', verifyToken, allowRoles('staff'), medicineController.addMedicine);
router.get('/:residentId', verifyToken, medicineController.getMedicinesByResident);
router.get('/:residentId/today', verifyToken, medicineController.getTodayLog);
router.get('/:residentId/adherence', verifyToken, medicineController.getAdherenceStats);
router.patch('/log/:logId', verifyToken, medicineController.markDoseStatus);
router.patch('/:id', verifyToken, allowRoles('staff'), medicineController.updateMedicine);
router.delete('/:id', verifyToken, allowRoles('staff'), medicineController.deleteMedicine);

module.exports = router;