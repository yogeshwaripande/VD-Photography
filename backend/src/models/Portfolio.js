const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
    category: { 
        type: String, 
        required: true,
        trim: true
    },

    image: { 
        type: String, 
        required: true 
    },

    createdAt: { 
        type: Date, 
        default: Date.now 
    },

    // 🔥 AUTO DELETE AFTER 14 DAYS (DB CLEAN)
    expiry: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
});

// Index for performance
PortfolioSchema.index({ category: 1 });

module.exports = mongoose.model('Portfolio', PortfolioSchema);