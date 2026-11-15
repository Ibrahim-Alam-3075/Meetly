const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, voteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');


router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, createEvent);
router.post('/:id/vote', protect, voteEvent);


module.exports = router;