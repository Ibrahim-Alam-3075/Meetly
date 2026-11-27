const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    voteEvent,
    suggestOption,
    finalizeEvent,
    reopenEvent,
    setAttendance,
    savePreference,
    addComment,
    deleteComment,
    addTask,
    toggleTask,
    deleteTask,
    addExpense,
    deleteExpense,
    inviteParticipants,
    deleteEvent,
    updateAgenda
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventById);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.patch('/:id/agenda', protect, updateAgenda);
router.post('/:id/vote', protect, voteEvent);
router.post('/:id/suggest', protect, suggestOption);
router.patch('/:id/finalize', protect, finalizeEvent);
router.patch('/:id/reopen', protect, reopenEvent);
router.post('/:id/attendance', protect, setAttendance);
router.post('/:id/preference', protect, savePreference);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/tasks', protect, addTask);
router.patch('/:id/tasks/:taskId', protect, toggleTask);
router.delete('/:id/tasks/:taskId', protect, deleteTask);
router.post('/:id/expenses', protect, addExpense);
router.delete('/:id/expenses/:expenseId', protect, deleteExpense);
router.post('/:id/invite', protect, inviteParticipants);

module.exports = router;
