const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for notification'],
      index: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
      index: true,
    },
    medicineName: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          'appointment_held',
          'appointment_confirmed',
          'appointment_cancelled',
          'appointment_rescheduled',
          'appointment_reminder',
          'leave_alert',
          'medication_reminder',
          'system',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'scheduled', 'sent', 'failed', 'read'],
        message: '{VALUE} is not a valid notification status',
      },
      default: 'scheduled',
      index: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms'],
      default: 'in_app',
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, 'Retry count cannot be negative'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE COMPOUND INDEX FOR DUPLICATE PREVENTION:
// Prevents duplicate reminder notifications for the exact same patient, prescription, medicine, and scheduled time
notificationSchema.index(
  { userId: 1, prescriptionId: 1, medicineName: 1, scheduledFor: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'medication_reminder',
      prescriptionId: { $type: 'objectId' },
    },
    name: 'unique_medication_reminder_slot',
  }
);

// Optimize notification delivery worker queries
notificationSchema.index({ status: 1, scheduledFor: 1, retryCount: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
