const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 }).populate('organizer', 'name email');
        res.json(events);
    } catch (err) {
        res.status(500).send(err.message);}
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });}

        res.json(event);
    } catch (err) {
        res.status(500).send(err.message);
    }
};