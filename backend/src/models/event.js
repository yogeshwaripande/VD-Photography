const mongoose = require('mongoose'); // ✅ FIX

const eventSchema = new mongoose.Schema({
    customerName: { 
        type: String, 
        required: true,
        trim: true
    },

    eventName: { 
        type: String, 
        required: true,
        trim: true
    },

    photos: [{ type: String }],

    createdAt: { 
        type: Date, 
        default: Date.now
    },

    // ✅ ONLY ONE TTL (14 days - final delete)
    expiry: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
});

// Performance index
eventSchema.index({ customerName: 1, eventName: 1 });

module.exports = mongoose.model('Event', eventSchema);