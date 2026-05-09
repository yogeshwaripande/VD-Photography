const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // १. प्रकार ठरवा
        const type = req.baseUrl.includes('portfolio') ? 'portfolio' : 'events';
        
        // २. कॅटेगरी मिळवा (फोल्डर नेमसाठी सुरक्षित करा)
        // महत्त्वाची सूचना: फ्रंटएंडला formData मध्ये 'category' आधी 'append' करण्यास सांगा
        let category = (req.body.category) ? req.body.category.trim().replace(/\s+/g, '_') : 'General';
        
        // ३. पाथ तयार करा (src च्या बाहेर असलेल्या uploads साठी ../../ बरोबर आहे)
        const finalDir = path.resolve(__dirname, '../../uploads', type, category);
        
        // ४. फोल्डर तयार करा
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }
        
        cb(null, finalDir);
    },
    filename: (req, file, cb) => {
        // फाईल नेम युनिक ठेवा
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

module.exports = multer({ storage });