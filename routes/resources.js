const express = require('express');
const router = express.Router();
const { getResources, createResource } = require('../controllers/resourceController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', protect, getResources);
router.post('/', protect, requireRole('instructor', 'admin'), createResource);

module.exports = router;
