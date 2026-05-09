const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const uploadEvents = require('../middleware/eventUpload'); 


/* ==========================================================
   1. GET ROUTES
========================================================== */

// Get ALL events (Admin - full data up to 14 days)
router.get('/', eventController.getAllEvents);

// Get USER events (only last 7 days)
router.get('/user', eventController.getUserEvents);


/* ==========================================================
   2. UPLOAD
========================================================== */

// Upload new event photos
router.post(
    '/upload',
    uploadEvents.array('photos', 50),
    eventController.addEventPhotos
);


/* ==========================================================
   3. UPDATE
========================================================== */

// Update event name
router.put(
    '/update/:id',
    uploadEvents.single('photo'),
    eventController.updateEvent
);

// Update customer name (all events)
router.put(
    '/customer/:name',
    eventController.updateCustomerName
);


/* ==========================================================
   4. DELETE
========================================================== */

// ⚠ IMPORTANT: specific routes FIRST

// Delete all events of a customer
router.delete(
    '/customer/:name',
    eventController.deleteCustomer
);

// Delete single photo from event
router.delete(
    '/:id/photo',
    eventController.deleteSinglePhoto
);

// Delete entire event
router.delete(
    '/:id',
    eventController.deleteEvent
);


module.exports = router;