const mongoose = require('mongoose');

const medicineItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required (e.g. 500mg)'],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required (e.g. Once daily, TDS)'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required (e.g. 5 days, 1 month)'],
      trim: true,
    },
    timing: {
      type: String,
      enum: ['before_meal', 'after_meal', 'with_meal', 'bedtime', 'as_needed'],
      default: 'after_meal',
    },
    instructions: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required for prescription'],
      unique: true,
    },
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
    medicines: {
      type: [medicineItemSchema],
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'Prescription must contain at least one medicine',
      ],
    },
    instructions: {
      type: String,
      default: '',
      maxlength: [2000, 'Prescription instructions cannot exceed 2000 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query for patient medical history
prescriptionSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
