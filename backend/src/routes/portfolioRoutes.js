const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const upload = require('../middleware/upload');

router.get('/', portfolioController.getAllPhotos);
router.get('/:category', portfolioController.getPhotosByCategory);
router.post('/upload', upload.array('image', 50), portfolioController.uploadPhoto);

// कंट्रोलरमधील नवीन फंक्शन्स इथे वापरा
router.delete('/:id', portfolioController.deletePhoto);
router.put('/:id', portfolioController.updateCategory);

module.exports = router;