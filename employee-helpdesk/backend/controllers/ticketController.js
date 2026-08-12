const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { sendTicketAssignedEmail, sendTicketStatusEmail, sendTicketCommentEmail } = require('../services/emailService');
const User = require('../models/User');

// @desc    Get tickets (with role-based access & filtering)
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    try {
        let query = {};

        // Employees can only see their own tickets
        if (req.user.role === 'employee') {
            query.createdBy = req.user._id;
        }

        // Apply filters from query params (e.g. ?status=OPEN&priority=High)
        if (req.query.status) query.status = req.query.status.toUpperCase();
        if (req.query.priority) query.priority = req.query.priority;
        if (req.query.category) query.category = req.query.category;
        
        // Simple search on title or description
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name email role')
            .populate('assignedTo', 'name email role')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('createdBy', 'name email role')
            .populate('assignedTo', 'name email role')
            .populate('comments.user', 'name email role');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check if employee owns the ticket
        if (req.user.role === 'employee' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to view this ticket' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const ticket = await Ticket.create({
            title,
            description,
            category,
            priority,
            createdBy: req.user._id,
            history: [{
                action: 'Ticket created',
                user: req.user._id
            }]
        });

        // Notify all support and admin users about the new ticket
        const staffUsers = await User.find({ role: { $in: ['support', 'admin'] } }).select('_id');
        if (staffUsers.length > 0) {
            const notifications = staffUsers.map(staff => ({
                recipient: staff._id,
                message: `New ticket submitted: "${ticket.title}" (${ticket.category} - ${ticket.priority})`,
                type: 'ASSIGNMENT',
                relatedTicket: ticket._id
            }));
            await Notification.insertMany(notifications);
        }

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.user.role === 'employee' && ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // SECURITY: Only allow safe fields to be updated by the user
        const { title, description, category, priority } = req.body;
        if (title !== undefined) ticket.title = title;
        if (description !== undefined) ticket.description = description;
        if (category !== undefined) ticket.category = category;
        if (priority !== undefined) ticket.priority = priority;

        const updatedTicket = await ticket.save();

        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin only)
const deleteTicket = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized as an admin' });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        await ticket.deleteOne();

        res.json({ message: 'Ticket removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign ticket to support
// @route   PUT /api/tickets/:id/assign
// @access  Private (Support/Admin)
const assignTicket = async (req, res) => {
    try {
        if (req.user.role === 'employee') {
            return res.status(401).json({ message: 'Not authorized to assign tickets' });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // If assignedTo is provided, validate it's a support/admin user
        if (req.body.assignedTo) {
            const assignee = await User.findById(req.body.assignedTo).select('role');
            if (!assignee || assignee.role === 'employee') {
                return res.status(400).json({ message: 'Can only assign to support or admin users' });
            }
            ticket.assignedTo = req.body.assignedTo;
        } else {
            ticket.assignedTo = req.user._id; // self-assign
        }
        ticket.status = 'ASSIGNED';
        
        ticket.history.push({
            action: `Ticket assigned to support`,
            user: req.user._id
        });

        await ticket.save();

        // Create notification
        await Notification.create({
            recipient: ticket.createdBy,
            message: `Your ticket "${ticket.title}" was assigned to Support.`,
            type: 'ASSIGNMENT',
            relatedTicket: ticket._id
        });

        // Send email notification
        const creator = await User.findById(ticket.createdBy).select('name email');
        if (creator) {
            await sendTicketAssignedEmail(creator.email, creator.name, ticket.title, ticket._id);
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private (Support/Admin)
const updateTicketStatus = async (req, res) => {
    try {
        if (req.user.role === 'employee') {
            return res.status(401).json({ message: 'Not authorized to change status' });
        }

        const { status } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const oldStatus = ticket.status;
        ticket.status = status;
        
        ticket.history.push({
            action: `Status changed from ${oldStatus} to ${status}`,
            user: req.user._id
        });

        await ticket.save();

        // Create notification
        await Notification.create({
            recipient: ticket.createdBy,
            message: `Your ticket "${ticket.title}" is now ${status}.`,
            type: 'STATUS_UPDATE',
            relatedTicket: ticket._id
        });

        // Send email notification
        const creator = await User.findById(ticket.createdBy).select('name email');
        if (creator) {
            await sendTicketStatusEmail(creator.email, creator.name, ticket.title, status);
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add comment to ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
             return res.status(400).json({ message: 'Please add comment text' });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.user.role === 'employee' && ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to comment on this ticket' });
        }

        ticket.comments.push({
            user: req.user._id,
            text
        });

        ticket.history.push({
            action: 'Comment added',
            user: req.user._id
        });

        await ticket.save();

        // Notify ticket creator if commenter is support/admin
        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: ticket.createdBy,
                message: `New comment on your ticket "${ticket.title}".`,
                type: 'COMMENT',
                relatedTicket: ticket._id
            });

            // Send email notification
            const creator = await User.findById(ticket.createdBy).select('name email');
            if (creator) {
                await sendTicketCommentEmail(creator.email, creator.name, ticket.title, req.user.name);
            }
        }

        // Notify assigned support agent if commenter is the employee
        if (req.user.role === 'employee' && ticket.assignedTo && ticket.assignedTo.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: ticket.assignedTo,
                message: `Employee replied on ticket "${ticket.title}".`,
                type: 'COMMENT',
                relatedTicket: ticket._id
            });
        }

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private
const getTicketStats = async (req, res) => {
    try {
        let query = {};

        // Employees can only see their own tickets
        if (req.user.role === 'employee') {
            query.createdBy = req.user._id;
        }

        const tickets = await Ticket.find(query);

        const stats = {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'OPEN').length,
            assigned: tickets.filter(t => t.status === 'ASSIGNED').length,
            inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
            resolved: tickets.filter(t => t.status === 'RESOLVED').length,
            closed: tickets.filter(t => t.status === 'CLOSED').length,
            critical: tickets.filter(t => t.priority === 'Critical').length,
            categories: {
                hardware: tickets.filter(t => t.category === 'Hardware').length,
                software: tickets.filter(t => t.category === 'Software').length,
                network: tickets.filter(t => t.category === 'Network').length,
                hr: tickets.filter(t => t.category === 'HR').length,
                other: tickets.filter(t => t.category === 'Other').length
            }
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload attachments to ticket
// @route   POST /api/tickets/:id/attachments
// @access  Private
const uploadAttachments = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Verify authorization
        if (req.user.role === 'employee' && ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to upload attachments to this ticket' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Map files to paths
        const filePaths = req.files.map(file => `/uploads/${file.filename}`);
        
        ticket.attachments.push(...filePaths);
        
        ticket.history.push({
            action: `${req.files.length} attachment(s) added`,
            user: req.user._id
        });

        await ticket.save();

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};
