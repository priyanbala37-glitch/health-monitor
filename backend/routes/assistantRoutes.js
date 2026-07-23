const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { verifyToken, allowRoles } = require('../middleware/auth');

router.post('/ask', verifyToken, allowRoles('staff'), assistantController.ask);

module.exports = router;