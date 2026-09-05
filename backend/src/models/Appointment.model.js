const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema(
  {
    chiefComplaint: {
      type: String,
      default: '',
    },
    triageUrgency: {
      type: String,
      default: 'Low',
    },
    suggestedQuestions: {
      type: [String],
      default: [],
    },
    disclaimer: {
      type: String,
      default: 'AI-generated informational summary. This does not constitute a medical diagnosis.',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'fallback', 'unavailable'],
      default: 'pending',
    },
    rawResponse: {
      type: String,
      default: '',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const postVisitSummarySchema = new mongoose.Schema(
  {
    whatWasDiscussed: {
      type: String,
      default: '',
    },
    medicationSchedule: {
      type: [String],
      default: [],
    },
    importantInstructions: {
      type: [String],
      default: [],
    },
    followUpSteps: {
      type: String,
      default: '',
    },
    whenToSeekHelp: {
      type: String,
      default: '',
    },
    disclaimer: {
      type: String,
      default: "This summary is generated from your clinician's notes. Follow your clinician's instructions.",
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'fallback', 'unavailable'],
      default: 'pending',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Appointment date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
      index: true,
    },
    startTime: {
      type: String, // Format: HH:mm (e.g. 09:30)
      required: [true, 'Start time is required (HH:mm)'],
      match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be formatted as HH:mm'],
    },
    endTime: {
      type: String, // Format: HH:mm (e.g. 10:00)
      required: [true, 'End time is required (HH:mm)'],
      match: [/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be formatted as HH:mm'],
    },
    status: {
      type: String,
      enum: {
        values: ['held', 'pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
        message: '{VALUE} is not a valid appointment status',
      },
      default: 'confirmed',
      index: true,
    },
    heldAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    heldUntil: {
      type: Date,
      default: null,
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    symptoms: {
      type: String,
      default: '',
      maxlength: [2000, 'Symptoms description cannot exceed 2000 characters'],
      trim: true,
    },
    aiSummary: {
      type: aiSummarySchema,
      default: () => ({}),
    },
    doctorNotes: {
      type: String,
      default: '',
      maxlength: [5000, 'Clinical doctor notes cannot exceed 5000 characters'],
      trim: true,
    },
    diagnosis: {
      type: String,
      default: '',
      maxlength: [1000, 'Clinical diagnosis cannot exceed 1000 characters'],
      trim: true,
    },
    followUpInstructions: {
      type: String,
      default: '',
      maxlength: [2000, 'Follow-up instructions cannot exceed 2000 characters'],
      trim: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },
    postVisitSummary: {
      type: postVisitSummarySchema,
      default: () => ({}),
    },
    googleCalendarEventId: {
      type: String,
      default: '',
      trim: true,
    },
    googleCalendarSyncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed', 'not_connected', 'none'],
      default: 'none',
    },
    googleCalendarSyncError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL UNIQUE CONCURRENCY LOCK INDEX:
// Prevents duplicate appointments for the same doctor, date, and startTime
// Partial filter ignores cancelled appointments so freed slots can be safely rebooked.
appointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['held', 'pending', 'confirmed', 'completed', 'rescheduled'] },
    },
    name: 'unique_active_doctor_slot_lock',
  }
);

// Additional composite query optimization indexes
appointmentSchema.index({ doctorId: 1, date: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1, date: -1 });
appointmentSchema.index({ status: 1, expiresAt: 1 });
appointmentSchema.index({ date: -1, startTime: -1 });
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
