const express = require('express');
const router = express.Router();
const {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    updateTicketStatus,
    addComment,
    getTicketStats,
    uploadAttachments
} = require('../controllers/ticketController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getTickets)
    .post(protect, createTicket);

router.route('/stats')
    .get(protect, getTicketStats);

router.route('/:id')
    .get(protect, getTicket)
    .put(protect, updateTicket)
    .delete(protect, deleteTicket);

router.route('/:id/assign')
    .put(protect, assignTicket);

router.route('/:id/status')
    .put(protect, updateTicketStatus);

router.route('/:id/comments')
    .post(protect, addComment);

router.route('/:id/attachments')
    .post(protect, upload.array('attachments', 5), uploadAttachments);

module.exports = router;
