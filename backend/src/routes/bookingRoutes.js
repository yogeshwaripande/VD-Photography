const express = require('express');
const router = express.Router();
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingStats
} = require('../controllers/bookingController');

// Routes for bookings
router.route('/')
    .get(getBookings)
    .post(createBooking);

// Additional route for statistics (Must be before /:id)
router.get('/stats/summary', getBookingStats);

router.route('/:id')
    .get(getBooking)
    .put(updateBooking)
    .delete(deleteBooking);

module.exports = router;
