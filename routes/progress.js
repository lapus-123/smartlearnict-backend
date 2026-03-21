const express    = require('express');
const router     = express.Router();
const { saveProgress, getProgress, getHistory } = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.get('/history', protect, getHistory);
router.get('/',        protect, getProgress);
router.post('/',       protect, saveProgress);

module.exports = router;
