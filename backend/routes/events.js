const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, voteEvent, finalizeEvent , setAttendance} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');


router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, createEvent);
router.post('/:id/vote', protect, voteEvent);
router.patch('/:id/finalize', protect, finalizeEvent);
router.post('/:id/attendance', protect, setAttendance);

module.exports = router;