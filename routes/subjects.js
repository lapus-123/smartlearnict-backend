const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, updateSubject } = require('../controllers/subjectController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/',     getSubjects);                                      // public
router.post('/',    protect, requireRole('admin'), createSubject);
router.put('/:id',  protect, requireRole('admin'), updateSubject);

module.exports = router;
