const Event = require('../models/event');


/* ==========================================================
   1. Upload Photos / Create or Update Event
========================================================== */
exports.addEventPhotos = async (req, res) => {
    try {
        const { customerName, eventName } = req.body;
        const files = req.files;

        // Validate files
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded!" });
        }

        // Generate file paths
        const photoPaths = files.map(file => `uploads/events/${file.filename}`);

        // Create new event OR add photos to existing event
        const result = await Event.findOneAndUpdate(
            {
                customerName: customerName.trim(),
                eventName: eventName.trim()
            },
            {
                $push: { photos: { $each: photoPaths } }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.status(201).json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   2. Get ALL Events (Admin - 14 days data)
========================================================== */
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   3. Get USER Events (Only last 7 days)
========================================================== */
exports.getUserEvents = async (req, res) => {
    try {
        const now = new Date();

        // Filter only last 7 days data
        const events = await Event.find({
            createdAt: {
                $gte: new Date(now - 7 * 24 * 60 * 60 * 1000)
            }
        }).sort({ createdAt: -1 });

        res.status(200).json(events);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   4. Update Customer Name (All Events)
========================================================== */
exports.updateCustomerName = async (req, res) => {
    try {
        const oldName = decodeURIComponent(req.params.name);
        const { newName } = req.body;

        const result = await Event.updateMany(
            { customerName: oldName },
            { $set: { customerName: newName.trim() } }
        );

        res.status(200).json({
            message: "Customer name updated successfully",
            modified: result.modifiedCount
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   5. Update Event Name
========================================================== */
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { newType } = req.body;

        const updated = await Event.findByIdAndUpdate(
            id,
            { eventName: newType },
            { new: true }
        );

        res.status(200).json(updated);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   6. Delete Single Photo from Event
========================================================== */
exports.deleteSinglePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const { path } = req.query;

        const result = await Event.findByIdAndUpdate(
            id,
            { $pull: { photos: path } },
            { new: true }
        );

        res.status(200).json({ success: true, data: result });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   7. Delete Entire Event
========================================================== */
exports.deleteEvent = async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ==========================================================
   8. Delete All Events of a Customer
========================================================== */
exports.deleteCustomer = async (req, res) => {
    try {
        const name = decodeURIComponent(req.params.name);

        await Event.deleteMany({ customerName: name });

        res.status(200).json({
            message: "All events for this customer deleted"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};