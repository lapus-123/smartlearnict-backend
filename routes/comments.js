const express    = require('express');
const router     = express.Router();
const { getComments, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/',      protect, getComments);
router.post('/',     protect, createComment);
router.put('/:id',   protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
