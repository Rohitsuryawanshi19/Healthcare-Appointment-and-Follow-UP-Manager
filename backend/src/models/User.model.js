const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const googleCalendarSchema = new mongoose.Schema(
  {
    isConnected: {
      type: Boolean,
      default: false,
    },
    calendarEmail: {
      type: String,
      default: '',
    },
    tokens: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      select: false, // Never expose raw OAuth tokens to frontend JSON
    },
    connectedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === 'local';
        },
        'Password is required for local accounts',
      ],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default in queries
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['patient', 'doctor', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'patient',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: {
        values: ['local', 'google'],
        message: '{VALUE} is not a valid auth provider',
      },
      default: 'local',
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    googleCalendar: {
      type: googleCalendarSchema,
      default: () => ({ isConnected: false }),
    },
    demoData: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        if (ret.googleCalendar && ret.googleCalendar.tokens) {
          delete ret.googleCalendar.tokens;
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
