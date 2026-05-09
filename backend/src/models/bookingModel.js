const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingNo: {
        type: String,
        required: [true, 'Booking number is required'],
        unique: true,
        trim: true
    },
    customerId: {
        type: String,
        required: [true, 'Customer ID is required'],
        trim: true
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    photographerName: {
        type: String,
        required: [true, 'Photographer name is required'],
        trim: true
    },
    photographerWhatsapp: {
        type: String,
        trim: true,
        match: [
            /^[6-9]\d{9}$/,
            'Please enter a valid 10-digit mobile number'
        ]
    },
    assistants: {
        type: String,
        trim: true
    },
    services: [{
        type: String,
        trim: true
    }],
    eventType: {
        type: String,
        required: [true, 'Event type is required'],
        enum: {
            values: ['Wedding', 'Pre-Wedding', 'Corporate', 'Birthday', 'Maternity', 'Portrait'],
            message: 'Please select a valid event type'
        }
    },
    date: {
        type: String, // Keeping as String YYYY-MM-DD to match frontend input type="date" easily
        required: [true, 'Event date is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: String,
        required: [true, 'End time is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    locationAddress: {
        type: String,
        required: [true, 'Full address is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    estimatedCost: {
        type: Number,
        min: [0, 'Estimated cost cannot be negative']
    },
    advancePaid: {
        type: Number,
        min: [0, 'Advance paid cannot be negative']
    },
    paymentHistory: [{
        amount: Number,
        date: String
    }],
    equipment: [{
        type: String
    }],
    packageDetails: {
        type: String,
        trim: true
    },
    specialRequests: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

bookingSchema.virtual('balanceAmount').get(function() {
    return (this.estimatedCost || 0) - (this.advancePaid || 0);
});

module.exports = mongoose.model('Booking', bookingSchema);
