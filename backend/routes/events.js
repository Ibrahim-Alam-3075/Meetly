const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEventById,
    createEvent,
    voteEvent,
    finalizeEvent,
    setAttendance,
    savePreference,
    deleteEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, createEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/vote', protect, voteEvent);
router.patch('/:id/finalize', protect, finalizeEvent);
router.post('/:id/attendance', protect, setAttendance);
router.post('/:id/preference', protect, savePreference);

module.exports = router;
