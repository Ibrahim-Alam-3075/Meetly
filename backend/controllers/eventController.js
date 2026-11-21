const Event = require('../models/Event');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const hideOthers = (event, user) => {
    const data = event.toObject();
    const organizerId = data.organizer._id ? data.organizer._id.toString() : data.organizer.toString();
    const isOrganizer = organizerId === user._id.toString();

    if (!isOrganizer) {
        data.attendance = (data.attendance || []).filter((item) => String(item.user) === String(user._id));
        data.preferences = (data.preferences || []).filter((item) => String(item.user) === String(user._id));
    }

    return data;
};

exports.getEvents = async (req, res) => {
    try {
        const me = req.user._id;
        const events = await Event.find({
            $or: [
                { organizer: me },
                { 'dates.votes': me },
                { 'venues.votes': me },
                { 'attendance.user': me },
                { 'preferences.user': me }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('organizer', 'name email');

        res.json(events.map((event) => hideOthers(event, req.user)));
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, type, description, dates, venues, agenda } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Please enter a title' });
        }

        if (!dates || dates.length === 0) {
            return res.status(400).json({ message: 'Please add at least one date' });
        }

        const event = new Event({
            title,
            type,
            description,
            date: dates[0].date,
            dates: dates.map((item) => ({ date: item.date, time: item.time })),
            venues: (venues || []).map((item) => ({ place: item.place, link: item.link })),
            agenda: type === 'Meeting' ? agenda : '',
            organizer: req.user._id
        });

        await event.save();
        await event.populate('organizer', 'name email');
        res.status(201).json(event);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.voteEvent = async (req, res) => {
    try {
        const { kind, index } = req.body;
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.votingClosed) {
            return res.status(400).json({ message: 'Voting is closed' });
        }

        const option = event[kind][index];
        const userId = req.user._id.toString();
        const alreadyVoted = option.votes.some((id) => id.toString() === userId);

        if (alreadyVoted) {
            option.votes = option.votes.filter((id) => id.toString() !== userId);
        } else {
            option.votes.push(req.user._id);
        }

        await event.save();
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.finalizeEvent = async (req, res) => {
    try {
        const { dateIndex, venueIndex } = req.body;
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.votingClosed) {
            return res.status(400).json({ message: 'Voting is closed for this event' });
        }

        if (event.organizer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the organizer can finalize this event' });
        }

        const dateChoice = event.dates[dateIndex];
        const venueChoice = event.venues[venueIndex];

        if (!dateChoice || !venueChoice) {
            return res.status(400).json({ message: 'Please choose a date and a venue' });
        }

        event.votingClosed = true;
        event.date = dateChoice.date;
        event.finalDate = dateChoice.date;
        event.finalTime = dateChoice.time;
        event.finalVenue = { place: venueChoice.place, link: venueChoice.link };

        await event.save();

        // Notify all voters and attendees about the finalized plan
        try {
            const voterIds = new Set();
            (event.dates || []).forEach(d => (d.votes || []).forEach(id => voterIds.add(id.toString())));
            (event.venues || []).forEach(v => (v.votes || []).forEach(id => voterIds.add(id.toString())));
            (event.attendance || []).forEach(a => { if (a.user) voterIds.add(a.user.toString()); });

            const voters = await User.find({ _id: { $in: Array.from(voterIds) } }).select('email name');
            const emailSet = new Set(voters.map(u => u.email).filter(Boolean));
            (event.attendance || []).forEach(a => { if (a.email) emailSet.add(a.email); });

            const recipients = Array.from(emailSet);

            if (recipients.length > 0) {
                const venueDisplay = event.finalVenue.place
                    ? event.finalVenue.place + (event.finalVenue.link ? ` (${event.finalVenue.link})` : '')
                    : event.finalVenue.link;

                sendEmail({
                    to: recipients,
                    subject: `Event Finalized: ${event.title}`,
                    text: `Hello!\n\nThe event "${event.title}" has been finalized by the organizer.\n\nFinal Date: ${event.finalDate}${event.finalTime ? ' at ' + event.finalTime : ''}\nFinal Venue: ${venueDisplay}\n\nView details: http://localhost:5173/event/${event._id}\n\nBest regards,\nMeetly Team`,
                    html: `
                        <h2>Event Finalized: ${event.title}</h2>
                        <p>The organizer has confirmed the final date and venue for <strong>${event.title}</strong>.</p>
                        <ul>
                            <li><strong>Date:</strong> ${event.finalDate}${event.finalTime ? ' at ' + event.finalTime : ''}</li>
                            <li><strong>Venue:</strong> ${venueDisplay}</li>
                        </ul>
                        <p><a href="http://localhost:5173/event/${event._id}">Click here to view event details & map</a></p>
                    `
                }).catch(err => console.error('Email notification background error:', err));
            }
        } catch (emailErr) {
            console.error('Email notification error:', emailErr.message);
        }

        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.setAttendance = async (req, res) => {
    try {
        const { choice } = req.body;
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id.toString();
        const existing = (event.attendance || []).find((item) => item.user.toString() === userId);

        if (existing) {
            existing.choice = choice;
        } else {
            event.attendance.push({ user: req.user._id, name: req.user.name, email: req.user.email, choice });
        }

        await event.save();
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.savePreference = async (req, res) => {
    try {
        const { text } = req.body;
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.votingClosed) {
            return res.status(400).json({ message: 'Voting is closed for this event' });
        }

        const userId = req.user._id.toString();
        const existing = (event.preferences || []).find((item) => item.user.toString() === userId);

        if (existing) {
            existing.text = text;
        } else {
            event.preferences.push({ user: req.user._id, name: req.user.name, email: req.user.email, text });
        }

        await event.save();
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.organizer.equals(req.user._id)) {
            return res.status(403).json({ message: 'Only the organizer can delete this event' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully', id: req.params.id });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

exports.updateAgenda = async (req, res) => {
    try {
        const { agenda } = req.body;
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the organizer can manage the agenda' });
        }

        event.agenda = agenda ? agenda.trim() : '';
        await event.save();
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).send(err.message);
    }
};
