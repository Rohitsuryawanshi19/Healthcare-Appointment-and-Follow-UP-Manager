const mongoose = require('mongoose');

const defaultWorkingHours = [
  { day: 'Monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Friday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
  { day: 'Saturday', isAvailable: false, startTime: '09:00', endTime: '13:00' },
  { day: 'Sunday', isAvailable: false, startTime: '09:00', endTime: '13:00' },
];

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required for Doctor profile'],
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      index: true,
    },
    qualification: {
      type: String,
      required: [true, 'Medical qualification is required (e.g. MBBS, MD)'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Medical Council registration number is required'],
      unique: true,
      trim: true,
    },
    registrationCouncil: {
      type: String,
      required: [true, 'Medical Council authority name is required'],
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience years cannot be negative'],
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: [0, 'Fee cannot be negative'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    workingHours: {
      type: [
        {
          day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true,
          },
          isAvailable: {
            type: Boolean,
            default: true,
          },
          startTime: {
            type: String,
            default: '09:00',
          },
          endTime: {
            type: String,
            default: '17:00',
          },
        },
      ],
      default: defaultWorkingHours,
    },
    slotDuration: {
      type: Number,
      default: 30, // 30 minutes
      min: [10, 'Slot duration must be at least 10 minutes'],
      max: [120, 'Slot duration cannot exceed 120 minutes'],
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
      index: true,
    },
    verificationSource: {
      type: String,
      default: 'Manual Administrative Verification',
      trim: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    demoData: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching verified doctors by specialization and experience ranking
doctorSchema.index({ specialization: 1, verificationStatus: 1 });
doctorSchema.index({ verificationStatus: 1, experience: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
