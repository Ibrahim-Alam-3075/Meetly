const Event = require('../models/Event');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const POPULATE_FIELDS = [
    { path: 'organizer', select: 'name email avatarColor' },
    { path: 'dates.votes', select: 'name email avatarColor' },
    { path: 'dates.maybeVotes', select: 'name email avatarColor' },
    { path: 'venues.votes', select: 'name email avatarColor' },
    { path: 'venues.maybeVotes', select: 'name email avatarColor' },
    { path: 'customPoll.options.votes', select: 'name email avatarColor' }
];

const broadcastEvent = (req, eventId) => {
    const io = req.app.get('io');
    if (io) {
        io.to(String(eventId)).emit('event-updated', { eventId: String(eventId) });
    }
};

const getIdStr = (v) => (v && v._id ? v._id.toString() : String(v));

const isDeadlinePassed = (event) => {
    const dl = event.pollSettings && event.pollSettings.votingDeadline;
    if (!dl) return false;
    const ts = Date.parse(dl);
    return !Number.isNaN(ts) && ts <= Date.now();
};

const checkAutoFinalize = async (event) => {
    if (!event || event.votingClosed) return event;
    if (!isDeadlinePassed(event)) return event;
    if (!event.pollSettings || !event.pollSettings.autoFinalize) return event;

    let bestDateIdx = 0;
    let bestDateScore = -1;
    (event.dates || []).forEach((d, i) => {
        const score = (d.votes ? d.votes.length : 0) * 2 + (d.maybeVotes ? d.maybeVotes.length : 0);
        if (score > bestDateScore) {
            bestDateScore = score;
            bestDateIdx = i;
        }
    });

    let bestVenueIdx = 0;
    let bestVenueScore = -1;
    (event.venues || []).forEach((v, i) => {
        const score = (v.votes ? v.votes.length : 0) * 2 + (v.maybeVotes ? v.maybeVotes.length : 0);
        if (score > bestVenueScore) {
            bestVenueScore = score;
            bestVenueIdx = i;
        }
    });

    const dateChoice = event.dates[bestDateIdx];
    const venueChoice = event.venues[bestVenueIdx];

    if (dateChoice) {
        event.votingClosed = true;
        event.date = dateChoice.date;
        event.finalDate = dateChoice.date;
        event.finalTime = dateChoice.time || '';
        event.finalVenue = venueChoice
            ? { place: venueChoice.place || '', link: venueChoice.link || '' }
            : { place: '', link: '' };
        await event.save();
    }
    return event;
};

const anonymizeVoters = (arr, meId) => {
    return (arr || []).map((v) => {
        const vid = getIdStr(v);
        if (vid === meId) return v;
        return { _id: vid, name: 'Anonymous', avatarColor: '#64748b' };
    });
};

const hideOthers = (event, user) => {
    const data = typeof event.toObject === 'function' ? event.toObject() : { ...event };
    const meId = user._id.toString();
    const organizerId = getIdStr(data.organizer);
    const isOrganizer = organizerId === meId;

    const allAttendance = data.attendance || [];
    data.attendanceSummary = {
        yes: allAttendance.filter((a) => a.choice === 'yes' && !a.waitlisted).length,
        waitlisted: allAttendance.filter((a) => a.choice === 'yes' && a.waitlisted).length,
        maybe: allAttendance.filter((a) => a.choice === 'maybe').length,
        no: allAttendance.filter((a) => a.choice === 'no').length
    };

    if (!isOrganizer) {
        data.attendance = allAttendance.filter((item) => getIdStr(item.user) === meId);
        data.preferences = (data.preferences || []).filter((item) => getIdStr(item.user) === meId);
    }

    if (data.pollSettings && data.pollSettings.anonymousVoting) {
        data.dates = (data.dates || []).map((d) => ({
            ...d,
            votes: anonymizeVoters(d.votes, meId),
            maybeVotes: anonymizeVoters(d.maybeVotes, meId)
        }));
        data.venues = (data.venues || []).map((v) => ({
            ...v,
            votes: anonymizeVoters(v.votes, meId),
            maybeVotes: anonymizeVoters(v.maybeVotes, meId)
        }));
        if (data.customPoll && data.customPoll.options) {
            data.customPoll.options = data.customPoll.options.map((o) => ({
                ...o,
                votes: anonymizeVoters(o.votes, meId)
            }));
        }
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
                { 'dates.maybeVotes': me },
                { 'venues.votes': me },
                { 'venues.maybeVotes': me },
                { 'customPoll.options.votes': me },
                { 'attendance.user': me },
                { 'preferences.user': me },
                { 'comments.user': me }
            ]
        })
            .sort({ date: 1 })
            .populate(POPULATE_FIELDS);

        for (const ev of events) {
            await checkAutoFinalize(ev);
        }

        res.json(events.map((event) => hideOthers(event, req.user)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await checkAutoFinalize(event);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const {
            title,
            type,
            description,
            coverTheme,
            icon,
            maxAttendees,
            pollSettings,
            dates,
            venues,
            customPoll,
            agenda
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Please enter a title' });
        }

        if (!dates || dates.length === 0) {
            return res.status(400).json({ message: 'Please add at least one date' });
        }

        const cleanCustomPoll =
            customPoll && customPoll.question && customPoll.question.trim() && Array.isArray(customPoll.options)
                ? {
                      question: customPoll.question.trim(),
                      options: customPoll.options
                          .map((o) => (typeof o === 'string' ? o.trim() : (o.label || '').trim()))
                          .filter(Boolean)
                          .map((label) => ({ label, votes: [] }))
                  }
                : { question: '', options: [] };

        const event = new Event({
            title: title.trim(),
            type: type || 'Hangout',
            description: (description || '').trim(),
            coverTheme: coverTheme || 'indigo',
            icon: icon || '',
            maxAttendees: Number(maxAttendees) > 0 ? Number(maxAttendees) : 0,
            pollSettings: {
                votingMode: pollSettings?.votingMode === 'single' ? 'single' : 'multiple',
                allowSuggestions: pollSettings?.allowSuggestions !== false,
                anonymousVoting: Boolean(pollSettings?.anonymousVoting),
                votingDeadline: pollSettings?.votingDeadline || '',
                autoFinalize: Boolean(pollSettings?.autoFinalize)
            },
            date: dates[0].date,
            dates: dates.map((item) => ({
                date: item.date,
                time: item.time || '',
                endTime: item.endTime || ''
            })),
            venues: (venues || []).map((item) => ({
                place: item.place || '',
                link: item.link || '',
                mode: ['In-Person', 'Online', 'Hybrid'].includes(item.mode) ? item.mode : 'In-Person',
                estimatedCost: item.estimatedCost || ''
            })),
            customPoll: cleanCustomPoll,
            agenda: (agenda || '').trim(),
            organizer: req.user._id
        });

        await event.save();
        await event.populate(POPULATE_FIELDS);
        res.status(201).json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (getIdStr(event.organizer) !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the organizer can edit this event' });
        }

        const { title, type, description, coverTheme, icon, maxAttendees, pollSettings, agenda } = req.body;
        if (title !== undefined && title.trim()) event.title = title.trim();
        if (type !== undefined) event.type = type;
        if (description !== undefined) event.description = description.trim();
        if (coverTheme !== undefined) event.coverTheme = coverTheme;
        if (icon !== undefined) event.icon = icon;
        if (maxAttendees !== undefined) event.maxAttendees = Number(maxAttendees) > 0 ? Number(maxAttendees) : 0;
        if (agenda !== undefined) event.agenda = agenda.trim();
        if (pollSettings) {
            event.pollSettings = {
                votingMode: pollSettings.votingMode === 'single' ? 'single' : 'multiple',
                allowSuggestions: pollSettings.allowSuggestions !== false,
                anonymousVoting: Boolean(pollSettings.anonymousVoting),
                votingDeadline: pollSettings.votingDeadline || '',
                autoFinalize: Boolean(pollSettings.autoFinalize)
            };
        }

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.voteEvent = async (req, res) => {
    try {
        const { kind, index, level = 'yes' } = req.body;
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await checkAutoFinalize(event);

        if (event.votingClosed || isDeadlinePassed(event)) {
            return res.status(400).json({ message: 'Voting is closed for this event' });
        }

        const userId = req.user._id.toString();
        const isSingleMode = event.pollSettings && event.pollSettings.votingMode === 'single';

        if (kind === 'customPoll') {
            const options = event.customPoll && event.customPoll.options;
            if (!options || !options[index]) {
                return res.status(400).json({ message: 'Invalid poll option' });
            }
            const target = options[index];
            const already = target.votes.some((id) => getIdStr(id) === userId);
            if (isSingleMode) {
                options.forEach((opt) => {
                    opt.votes = opt.votes.filter((id) => getIdStr(id) !== userId);
                });
                if (!already) target.votes.push(req.user._id);
            } else {
                if (already) {
                    target.votes = target.votes.filter((id) => getIdStr(id) !== userId);
                } else {
                    target.votes.push(req.user._id);
                }
            }
        } else if (kind === 'dates' || kind === 'venues') {
            const list = event[kind];
            const option = list && list[index];
            if (!option) {
                return res.status(400).json({ message: 'Invalid option index' });
            }

            const targetField = level === 'maybe' ? 'maybeVotes' : 'votes';
            const otherField = level === 'maybe' ? 'votes' : 'maybeVotes';

            option.votes = option.votes || [];
            option.maybeVotes = option.maybeVotes || [];

            const alreadyInTarget = option[targetField].some((id) => getIdStr(id) === userId);

            if (isSingleMode) {
                list.forEach((item) => {
                    item.votes = (item.votes || []).filter((id) => getIdStr(id) !== userId);
                    item.maybeVotes = (item.maybeVotes || []).filter((id) => getIdStr(id) !== userId);
                });
                if (!alreadyInTarget) {
                    option[targetField].push(req.user._id);
                }
            } else {
                // Remove from other bucket first so user isn't both yes & maybe
                option[otherField] = option[otherField].filter((id) => getIdStr(id) !== userId);
                if (alreadyInTarget) {
                    option[targetField] = option[targetField].filter((id) => getIdStr(id) !== userId);
                } else {
                    option[targetField].push(req.user._id);
                }
            }
        } else {
            return res.status(400).json({ message: 'Invalid vote kind' });
        }

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.suggestOption = async (req, res) => {
    try {
        const { kind, date, time, endTime, place, link, mode, estimatedCost } = req.body;
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.votingClosed || isDeadlinePassed(event)) {
            return res.status(400).json({ message: 'Voting is closed' });
        }
        if (event.pollSettings && event.pollSettings.allowSuggestions === false) {
            return res.status(403).json({ message: 'Participant suggestions are disabled for this event' });
        }

        if (kind === 'dates') {
            if (!date) return res.status(400).json({ message: 'Please provide a date' });
            event.dates.push({
                date,
                time: time || '',
                endTime: endTime || '',
                votes: [req.user._id],
                maybeVotes: [],
                suggestedBy: req.user.name
            });
        } else if (kind === 'venues') {
            if (!place && !link) return res.status(400).json({ message: 'Please provide a place or link' });
            event.venues.push({
                place: place || '',
                link: link || '',
                mode: ['In-Person', 'Online', 'Hybrid'].includes(mode) ? mode : 'In-Person',
                estimatedCost: estimatedCost || '',
                votes: [req.user._id],
                maybeVotes: [],
                suggestedBy: req.user.name
            });
        } else {
            return res.status(400).json({ message: 'Invalid suggestion kind' });
        }

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.status(201).json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.finalizeEvent = async (req, res) => {
    try {
        const { dateIndex, venueIndex } = req.body;
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.votingClosed) {
            return res.status(400).json({ message: 'Voting is already closed for this event' });
        }

        if (getIdStr(event.organizer) !== req.user._id.toString()) {
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
        event.finalTime = dateChoice.time || '';
        event.finalVenue = { place: venueChoice.place || '', link: venueChoice.link || '' };

        await event.save();
        await event.populate(POPULATE_FIELDS);

        // Notify all voters and attendees about the finalized plan
        try {
            const voterIds = new Set();
            (event.dates || []).forEach((d) => {
                (d.votes || []).forEach((id) => voterIds.add(getIdStr(id)));
                (d.maybeVotes || []).forEach((id) => voterIds.add(getIdStr(id)));
            });
            (event.venues || []).forEach((v) => {
                (v.votes || []).forEach((id) => voterIds.add(getIdStr(id)));
                (v.maybeVotes || []).forEach((id) => voterIds.add(getIdStr(id)));
            });
            (event.attendance || []).forEach((a) => {
                if (a.user) voterIds.add(getIdStr(a.user));
            });

            const voters = await User.find({ _id: { $in: Array.from(voterIds) } }).select('email name');
            const emailSet = new Set(voters.map((u) => u.email).filter(Boolean));
            (event.attendance || []).forEach((a) => {
                if (a.email) emailSet.add(a.email);
            });

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
                        <p><a href="http://localhost:5173/event/${event._id}">Click here to view event details &amp; map</a></p>
                    `
                }).catch((err) => console.error('Email notification background error:', err));
            }
        } catch (emailErr) {
            console.error('Email notification error:', emailErr.message);
        }

        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.reopenEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (getIdStr(event.organizer) !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the organizer can reopen voting' });
        }

        event.votingClosed = false;
        event.finalDate = null;
        event.finalTime = null;
        event.finalVenue = { place: '', link: '' };
        if (isDeadlinePassed(event) && event.pollSettings) {
            event.pollSettings.votingDeadline = '';
        }

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.setAttendance = async (req, res) => {
    try {
        const { choice } = req.body;
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id.toString();
        const existing = (event.attendance || []).find((item) => getIdStr(item.user) === userId);
        const confirmedYesCount = (event.attendance || []).filter(
            (a) => a.choice === 'yes' && !a.waitlisted && getIdStr(a.user) !== userId
        ).length;

        const shouldWaitlist =
            choice === 'yes' &&
            event.maxAttendees > 0 &&
            confirmedYesCount >= event.maxAttendees;

        if (existing) {
            existing.choice = choice;
            existing.waitlisted = shouldWaitlist;
        } else {
            event.attendance.push({
                user: req.user._id,
                name: req.user.name,
                email: req.user.email,
                choice,
                waitlisted: shouldWaitlist
            });
        }

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.savePreference = async (req, res) => {
    try {
        const { text } = req.body;
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.votingClosed || isDeadlinePassed(event)) {
            return res.status(400).json({ message: 'Voting is closed for this event' });
        }

        const userId = req.user._id.toString();
        const existing = (event.preferences || []).find((item) => getIdStr(item.user) === userId);

        if (existing) {
            existing.text = text;
        } else {
            event.preferences.push({ user: req.user._id, name: req.user.name, email: req.user.email, text });
        }

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.comments.push({
            user: req.user._id,
            name: req.user.name,
            avatarColor: req.user.avatarColor || '#6366f1',
            text: text.trim()
        });

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.status(201).json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const comment = event.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const isOrganizer = getIdStr(event.organizer) === req.user._id.toString();
        const isAuthor = getIdStr(comment.user) === req.user._id.toString();
        if (!isOrganizer && !isAuthor) {
            return res.status(403).json({ message: 'Not allowed to delete this comment' });
        }

        comment.deleteOne();
        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addTask = async (req, res) => {
    try {
        const { text, assigneeName } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Task text is required' });

        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.tasks.push({
            text: text.trim(),
            assigneeName: (assigneeName || '').trim(),
            completed: false,
            createdBy: req.user._id
        });

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.status(201).json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.toggleTask = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const task = event.tasks.id(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.completed = !task.completed;
        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const task = event.tasks.id(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.deleteOne();
        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addExpense = async (req, res) => {
    try {
        const { title, amount, paidByName } = req.body;
        if (!title || !title.trim() || !amount || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Please provide an expense title and positive amount' });
        }

        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        event.expenses.push({
            title: title.trim(),
            amount: Number(amount),
            paidBy: req.user._id,
            paidByName: (paidByName || req.user.name).trim()
        });

        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.status(201).json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const expense = event.expenses.id(req.params.expenseId);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        expense.deleteOne();
        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.inviteParticipants = async (req, res) => {
    try {
        const { emails } = req.body;
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const list = (Array.isArray(emails) ? emails : String(emails || '').split(/[\s,;]+/))
            .map((e) => e.trim())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

        if (list.length === 0) {
            return res.status(400).json({ message: 'Please provide at least one valid email address' });
        }

        const link = `http://localhost:5173/event/${event._id}`;
        await sendEmail({
            to: list,
            subject: `You're invited: ${event.title} (Meetly)`,
            text: `${req.user.name} invited you to vote and RSVP for "${event.title}".\n\nOpen event: ${link}`,
            html: `
                <h2>You're invited to ${event.title}</h2>
                <p><strong>${req.user.name}</strong> invited you on Meetly to vote on dates/venues and RSVP.</p>
                <p>${event.description || ''}</p>
                <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Open Event &amp; Vote</a></p>
            `
        });

        res.json({ message: `Invites sent to ${list.length} recipient(s)` });
    } catch (err) {
        res.status(500).json({ message: 'Could not send invites: ' + err.message });
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
        broadcastEvent(req, req.params.id);
        res.json({ message: 'Event deleted successfully', id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateAgenda = async (req, res) => {
    try {
        const { agenda } = req.body;
        const event = await Event.findById(req.params.id).populate(POPULATE_FIELDS);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (getIdStr(event.organizer) !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the organizer can manage the agenda' });
        }

        event.agenda = agenda ? agenda.trim() : '';
        await event.save();
        await event.populate(POPULATE_FIELDS);
        broadcastEvent(req, event._id);
        res.json(hideOthers(event, req.user));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
