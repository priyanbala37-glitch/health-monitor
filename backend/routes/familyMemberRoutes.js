const express = require('express');
const router = express.Router();
const controller = require('../controllers/familyMemberController');
const { verifyToken, allowRoles } = require('../middleware/auth');

router.post('/', verifyToken, allowRoles('staff'), controller.addFamilyMember);
router.get('/:residentId', verifyToken, controller.getFamilyMembers);
router.delete('/:id', verifyToken, allowRoles('staff'), controller.deleteFamilyMember);

module.exports = router;