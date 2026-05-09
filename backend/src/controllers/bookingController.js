const Booking = require('../models/bookingModel');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching bookings'
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching booking'
        });
    }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const bookingData = req.body;

        // Remove empty id if present to prevent CastError
        if (bookingData.id === '') delete bookingData.id;
        if (bookingData._id === '') delete bookingData._id;

        // Generate booking number if not provided
        if (!bookingData.bookingNo) {
            const count = await Booking.countDocuments();
            bookingData.bookingNo = `BK-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
        }

        // Generate customer ID if not provided
        if (!bookingData.customerId) {
            const count = await Booking.countDocuments();
            bookingData.customerId = `CUST-${(count + 1).toString().padStart(3, '0')}`;
        }

        // Initialize payment history if advance is paid
        if (bookingData.advancePaid > 0 && (!bookingData.paymentHistory || bookingData.paymentHistory.length === 0)) {
            bookingData.paymentHistory = [{
                amount: Number(bookingData.advancePaid),
                date: new Date().toISOString().split('T')[0]
            }];
        }

        const booking = await Booking.create(bookingData);

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Booking number already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error while creating booking'
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating booking'
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting booking'
        });
    }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/summary
// @access  Private
const getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    revenue: { $sum: '$estimatedCost' },
                    advance: { $sum: '$advancePaid' }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            revenue: 0,
            advance: 0
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get booking stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching statistics'
        });
    }
};

module.exports = {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingStats
};