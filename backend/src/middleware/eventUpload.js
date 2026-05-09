const multer = require('multer');
const path = require('path');
const fs = require('fs');

// पाथ असा सेट करा जो थेट तुमच्या 'backend/uploads/events' ला टारगेट करेल
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 'backend' फोल्डरच्या आत 'uploads/events'
        const uploadPath = path.join(__dirname, '../../uploads/events');
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;