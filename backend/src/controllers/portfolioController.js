const Portfolio = require('../models/Portfolio');
const path = require('path');
const fs = require('fs');

// १. फोटो अपलोड करणे (Multiple Photos with Category Folder Path)
exports.uploadPhoto = async (req, res) => {
    try {
        const { category } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "No photos selected" });
        }

        if (!category) {
            return res.status(400).json({ message: "Please select a category" });
        }

        const categoryFolder = category.trim().replace(/\s+/g, '_');

        const uploadPromises = files.map(file => {
            const dbPath = `uploads/portfolio/${categoryFolder}/${file.filename}`;
            
            const newPhoto = new Portfolio({
                category: category.trim(),
                image: dbPath
            });
            return newPhoto.save();
        });

        const savedPhotos = await Promise.all(uploadPromises);

        return res.status(201).json({ 
            success: true, 
            message: "Uploaded successfully!", 
            count: savedPhotos.length 
        });
    } catch (err) {
        console.error("Upload Error:", err);
        return res.status(500).json({ error: err.message });
    }
};

// २. सर्व फोटो मिळवणे
exports.getAllPhotos = async (req, res) => {
    try {
        const photos = await Portfolio.find().sort({ createdAt: -1 });
        return res.status(200).json(photos);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ३. कॅटेगरीनुसार फोटो फिल्टर करणे
exports.getPhotosByCategory = async (req, res) => {
    try {
        const photos = await Portfolio.find({ category: req.params.category });
        return res.status(200).json(photos);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ४. फोटो डिलीट करणे (डेटाबेस + फिजिकल फाईल)
exports.deletePhoto = async (req, res) => {
    try {
        const photoId = req.params.id;
        const photo = await Portfolio.findById(photoId);

        if (!photo) {
            return res.status(404).json({ message: "Photo not found" });
        }

        const filePath = path.join(__dirname, '../../', photo.image);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Portfolio.findByIdAndDelete(photoId);
        return res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// ५. कॅटेगरी अपडेट करणे
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.body;

        const updatedPhoto = await Portfolio.findByIdAndUpdate(
            id,
            { category: category },
            { new: true }
        );

        if (!updatedPhoto) {
            return res.status(404).json({ message: "Photo not found" });
        }

        return res.status(200).json(updatedPhoto);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};


/* =========================================
   AUTO DELETE OLD PORTFOLIO PHOTOS
   (Delete after 14 days)
========================================= */

exports.autoDeleteOldPortfolioPhotos = async () => {
    try {

        const fourteenDaysAgo = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000));

        const oldPhotos = await Portfolio.find({
            createdAt: { $lt: fourteenDaysAgo }
        });

        for (let photo of oldPhotos) {

            const filePath = path.join(__dirname, '../../', photo.image);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await Portfolio.findByIdAndDelete(photo._id);
        }

        console.log("Old portfolio photos cleanup completed");

    } catch (err) {
        console.error("Portfolio auto delete error:", err);
    }
};