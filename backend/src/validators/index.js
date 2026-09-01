const { z } = require('zod');

// Authentication Schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().trim().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    phone: z.string().trim().max(20, 'Phone number cannot exceed 20 characters').optional().default(''),
    role: z.enum(['patient', 'doctor', 'admin']).optional().default('patient'),
  }),
});

// Appointment Schemas
const holdSlotSchema = z.object({
  body: z.object({
    doctorId: z.string().trim().min(1, 'Doctor ID is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    startTime: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'),
  }),
});

const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().trim().min(1, 'Doctor ID is required').optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    startTime: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format').optional(),
    heldAppointmentId: z.string().trim().optional(),
    symptoms: z.string().trim().max(2000, 'Symptoms cannot exceed 2000 characters').optional().default(''),
  }),
});

const rescheduleAppointmentSchema = z.object({
  body: z.object({
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'New date must be in YYYY-MM-DD format'),
    newStartTime: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/, 'New start time must be in HH:mm format'),
    symptoms: z.string().trim().max(2000, 'Symptoms cannot exceed 2000 characters').optional(),
  }),
});

// Doctor Consultation Schema
const consultationSchema = z.object({
  body: z.object({
    doctorNotes: z.string().trim().max(5000, 'Doctor notes cannot exceed 5000 characters').optional().default(''),
    diagnosis: z.string().trim().max(1000, 'Diagnosis cannot exceed 1000 characters').optional().default(''),
    followUpInstructions: z.string().trim().max(2000, 'Follow-up advice cannot exceed 2000 characters').optional().default(''),
    medicines: z.array(
      z.object({
        name: z.string().trim().min(1, 'Medicine name is required'),
        dosage: z.string().trim().min(1, 'Dosage is required'),
        frequency: z.string().trim().min(1, 'Frequency is required'),
        duration: z.string().trim().min(1, 'Duration is required'),
        timing: z.string().trim().optional().default('after_meal'),
        instructions: z.string().trim().max(500).optional().default(''),
      })
    ).optional().default([]),
  }),
});

module.exports = {
  loginSchema,
  registerSchema,
  holdSlotSchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  consultationSchema,
};
