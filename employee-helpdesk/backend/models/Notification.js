const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ['ASSIGNMENT', 'STATUS_UPDATE', 'COMMENT']
        },
        relatedTicket: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Ticket'
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
