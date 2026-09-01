const mongoose = require('mongoose');

const doctorLeaveSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required for leave record'],
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Leave date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Leave reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['approved', 'pending', 'cancelled'],
        message: '{VALUE} is not a valid leave status',
      },
      default: 'approved',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring no duplicate leave dates for the same doctor
doctorLeaveSchema.index(
  { doctorId: 1, date: 1 },
  {
    unique: true,
    name: 'unique_doctor_leave_date',
  }
);

module.exports = mongoose.model('DoctorLeave', doctorLeaveSchema);
