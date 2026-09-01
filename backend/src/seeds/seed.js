const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { User, Doctor, Appointment, Prescription, Notification, DoctorLeave } = require('../models');

async function seedDatabase() {
  console.log('=====================================================');
  console.log('🌱 CAREFLOW SYNTHETIC DEMO DATA SEEDING SYSTEM');
  console.log('⚠️  All seeded profiles are marked with demoData: true');
  console.log('⚠️  Synthetic registration IDs - NOT real-world credentials');
  console.log('=====================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careflow';
  await mongoose.connect(mongoUri);

  console.log('Cleaning existing demo data collections...');
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Prescription.deleteMany({}),
    Notification.deleteMany({}),
    DoctorLeave.deleteMany({}),
  ]);

  const defaultPassword = 'DemoPassword123!';

  // 1. Create Admin User
  console.log('Creating Admin Account...');
  const adminUser = await User.create({
    name: 'CareFlow Administrator',
    email: 'admin@demo.com',
    password: defaultPassword,
    phone: '+1 (555) 000-0001',
    role: 'admin',
    demoData: true,
  });

  // 2. Create Demo Patients
  console.log('Creating Demo Patients...');
  const patientAlice = await User.create({
    name: 'Alice Johnson',
    email: 'patient.a@demo.com',
    password: defaultPassword,
    phone: '+1 (555) 019-2834',
    role: 'patient',
    demoData: true,
  });

  const patientBob = await User.create({
    name: 'Robert Davis',
    email: 'patient.b@demo.com',
    password: defaultPassword,
    phone: '+1 (555) 019-5821',
    role: 'patient',
    demoData: true,
  });

  const patientCharlie = await User.create({
    name: 'Charlie Miller',
    email: 'patient.c@demo.com',
    password: defaultPassword,
    phone: '+1 (555) 019-9943',
    role: 'patient',
    demoData: true,
  });

  // 3. Create Demo Doctors (Dr. Aisha Verma, Dr. Rahul Mehta, Dr. Neha Sharma, Dr. Arjun Kapoor, Dr. Priya Nair)
  console.log('Creating Synthetic Demo Doctors...');

  const doctorsData = [
    {
      name: 'Dr. Aisha Verma',
      email: 'doctor.aisha@demo.com',
      phone: '+1 (555) 012-3001',
      specialization: 'Cardiology',
      qualification: 'MD (Cardiology), MBBS',
      registrationNumber: 'DEMO-REG-CARD-001',
      registrationCouncil: 'CareFlow Synthetic Demo Registry (Development Only)',
      experience: 12,
      consultationFee: 800,
      bio: 'Demo profile for development & testing. Clinical cardiologist focusing on preventive cardiac health, ECG interpretation, and hypertension management.',
      verificationStatus: 'verified',
    },
    {
      name: 'Dr. Rahul Mehta',
      email: 'doctor@demo.com', // Primary doctor login alias
      phone: '+1 (555) 012-3002',
      specialization: 'General Medicine',
      qualification: 'MD (Internal Medicine), MBBS',
      registrationNumber: 'DEMO-REG-GEN-002',
      registrationCouncil: 'CareFlow Synthetic Demo Registry (Development Only)',
      experience: 9,
      consultationFee: 500,
      bio: 'Demo profile for development & testing. Primary care clinician specializing in preventive screenings, chronic disease monitoring, and routine triage.',
      verificationStatus: 'verified',
    },
    {
      name: 'Dr. Neha Sharma',
      email: 'doctor.neha@demo.com',
      phone: '+1 (555) 012-3003',
      specialization: 'Dermatology',
      qualification: 'MD (Dermatology), DVL, MBBS',
      registrationNumber: 'DEMO-REG-DERM-003',
      registrationCouncil: 'CareFlow Synthetic Demo Registry (Development Only)',
      experience: 7,
      consultationFee: 700,
      bio: 'Demo profile for development & testing. Specialist in inflammatory dermatoses, acne management, and cutaneous allergy diagnostics.',
      verificationStatus: 'verified',
    },
    {
      name: 'Dr. Arjun Kapoor',
      email: 'doctor.arjun@demo.com',
      phone: '+1 (555) 012-3004',
      specialization: 'Pediatrics',
      qualification: 'MD (Pediatrics), DCH, MBBS',
      registrationNumber: 'DEMO-REG-PED-004',
      registrationCouncil: 'CareFlow Synthetic Demo Registry (Development Only)',
      experience: 11,
      consultationFee: 600,
      bio: 'Demo profile for development & testing. Pediatrician dedicated to adolescent care, immunization planning, and childhood wellness.',
      verificationStatus: 'verified',
    },
    {
      name: 'Dr. Priya Nair',
      email: 'doctor.priya@demo.com',
      phone: '+1 (555) 012-3005',
      specialization: 'Orthopedics',
      qualification: 'MS (Orthopedics), DNB, MBBS',
      registrationNumber: 'DEMO-REG-ORTHO-005',
      registrationCouncil: 'CareFlow Synthetic Demo Registry (Development Only)',
      experience: 14,
      consultationFee: 900,
      bio: 'Demo profile for development & testing. Orthopedic specialist managing musculoskeletal disorders, sports rehabilitation, and joint health.',
      verificationStatus: 'pending', // Seeded as pending for Admin verification workflow
    },
  ];

  const seededDoctors = [];

  for (const doc of doctorsData) {
    const user = await User.create({
      name: doc.name,
      email: doc.email,
      password: defaultPassword,
      phone: doc.phone,
      role: 'doctor',
      demoData: true,
    });

    const doctorProfile = await Doctor.create({
      userId: user._id,
      specialization: doc.specialization,
      qualification: doc.qualification,
      registrationNumber: doc.registrationNumber,
      registrationCouncil: doc.registrationCouncil,
      experience: doc.experience,
      consultationFee: doc.consultationFee,
      bio: doc.bio,
      verificationStatus: doc.verificationStatus,
      verifiedAt: doc.verificationStatus === 'verified' ? new Date() : null,
      verificationSource: 'CareFlow Automated Demo Seeder',
      slotDuration: 30,
      demoData: true,
    });

    seededDoctors.push({ user, doctor: doctorProfile, meta: doc });
  }

  // 4. Create Demo Appointments & AI Summaries
  console.log('Creating Demo Consultations & AI Summaries...');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const drRahul = seededDoctors.find((d) => d.meta.name === 'Dr. Rahul Mehta').doctor;
  const drAisha = seededDoctors.find((d) => d.meta.name === 'Dr. Aisha Verma').doctor;
  const drNeha = seededDoctors.find((d) => d.meta.name === 'Dr. Neha Sharma').doctor;

  // Appointment 1: Upcoming Confirmed Visit for Alice with Dr. Rahul
  const appt1 = await Appointment.create({
    patientId: patientAlice._id,
    doctorId: drRahul._id,
    date: tomorrowStr,
    startTime: '10:00',
    endTime: '10:30',
    status: 'confirmed',
    symptoms: 'Experiencing intermittent dry cough, mild sore throat for 3 days, and slight fatigue in evenings.',
    aiSummary: {
      status: 'completed',
      triageUrgency: 'low',
      chiefComplaint: 'Upper respiratory irritation with intermittent dry cough and pharyngeal discomfort',
      suggestedQuestions: [
        'How many days have you experienced the dry cough, and does it worsen at night?',
        'Have you noticed any shortness of breath, wheezing, or fever spike above 100°F?',
        'Are you currently taking any over-the-counter antihistamines or cough syrups?',
      ],
      generatedAt: new Date(),
    },
    googleCalendarSyncStatus: 'synced',
    googleCalendarEventId: 'gcal_demo_evt_101',
  });

  const appt2 = await Appointment.create({
    patientId: patientAlice._id,
    doctorId: drRahul._id,
    date: todayStr,
    startTime: '09:00',
    endTime: '09:30',
    status: 'completed',
    symptoms: 'Fever of 101F and severe pharyngeal pain.',
    diagnosis: 'Acute Streptococcal Pharyngitis with mild cervical lymphadenitis',
    doctorNotes: 'Oropharyngeal examination reveals bilateral tonsillar erythema with follicular exudates. SpO2 99% on ambient air, BP 118/76 mmHg. Hydration and rest emphasized.',
    followUpInstructions: 'Review in clinic in 5 days if fever persists. Complete full 5-day antibiotic course.',
    postVisitSummary: {
      status: 'completed',
      whatWasDiscussed: 'Your physician diagnosed Acute Streptococcal Pharyngitis. Examination showed throat redness and enlarged lymph nodes.',
      medicationSchedule: [
        'Amoxicillin-Clavulanate 625mg: Take Twice daily for 5 days after meals.',
        'Paracetamol 650mg: Take As needed for 3 days if fever is present.',
        'Cetirizine 10mg: Take Once daily at bedtime for 5 days.',
      ],
      importantInstructions: [
        'Complete the full 5-day course of antibiotics even if symptoms resolve early.',
        'Stay well hydrated with warm fluids and rest vocal cords.',
      ],
      followUpSteps: 'Review in clinic in 5 days if fever or swallowing difficulty persists.',
      whenToSeekHelp: 'Seek immediate emergency medical attention if you experience difficulty breathing, inability to swallow liquids, or sudden rash/swelling.',
      disclaimer: 'This summary is generated from your clinician notes. Follow your clinician instructions.',
      generatedAt: new Date(),
    },
  });

  const rxAlice = await Prescription.create({
    appointmentId: appt2._id,
    patientId: patientAlice._id,
    doctorId: drRahul._id,
    medicines: [
      {
        name: 'Amoxicillin-Clavulanate',
        dosage: '625mg',
        frequency: 'Twice daily',
        duration: '5 days',
        timing: 'after_meal',
        instructions: 'Take 1 tablet after breakfast and 1 after dinner with plenty of water.',
      },
      {
        name: 'Paracetamol',
        dosage: '650mg',
        frequency: 'As needed',
        duration: '3 days',
        timing: 'after_meal',
        instructions: 'Take 1 tablet every 6-8 hours only if body temperature exceeds 100°F.',
      },
      {
        name: 'Cetirizine',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '5 days',
        timing: 'before_meal',
        instructions: 'Take 1 tablet before bedtime to relieve throat tickle.',
      },
    ],
  });

  appt2.prescriptionId = rxAlice._id;
  await appt2.save();

  // Appointment 3: Confirmed Cardiology Appointment for Bob with Dr. Aisha
  const appt3 = await Appointment.create({
    patientId: patientBob._id,
    doctorId: drAisha._id,
    date: nextWeekStr,
    startTime: '11:00',
    endTime: '11:30',
    status: 'confirmed',
    symptoms: 'Routine cardiovascular checkup, monitoring borderline blood pressure readings (135/88 mmHg).',
    aiSummary: {
      status: 'completed',
      triageUrgency: 'medium',
      chiefComplaint: 'Cardiovascular routine assessment for borderline systemic hypertension',
      suggestedQuestions: [
        'What are your average morning and evening home blood pressure log readings?',
        'Do you experience occasional palpitations, lightheadedness, or shortness of breath on exertion?',
        'Are there any dietary changes or sodium restriction regimens currently underway?',
      ],
      generatedAt: new Date(),
    },
    googleCalendarSyncStatus: 'synced',
    googleCalendarEventId: 'gcal_demo_evt_102',
  });

  // Appointment 4: Confirmed Dermatology Visit for Charlie with Dr. Neha
  const appt4 = await Appointment.create({
    patientId: patientCharlie._id,
    doctorId: drNeha._id,
    date: nextWeekStr,
    startTime: '14:00',
    endTime: '14:30',
    status: 'confirmed',
    symptoms: 'Erythematous pruritic rash on bilateral forearms after exposure to gardening soil.',
    aiSummary: {
      status: 'completed',
      triageUrgency: 'low',
      chiefComplaint: 'Contact dermatitis of bilateral forearms with localized pruritus',
      suggestedQuestions: [
        'Did the rash appear within 24-48 hours of plant or soil contact?',
        'Are there any blistering lesions or signs of secondary weeping?',
        'Have you applied topical hydrocortisone or emollients?',
      ],
      generatedAt: new Date(),
    },
  });

  // 5. Generate Initial Medication Reminder Notifications for RxAlice
  console.log('Generating Medication Reminder Notifications...');
  const reminders = [
    { time: '08:00', med: 'Amoxicillin-Clavulanate 625mg' },
    { time: '20:00', med: 'Amoxicillin-Clavulanate 625mg' },
    { time: '21:30', med: 'Cetirizine 10mg' },
  ];

  for (const r of reminders) {
    await Notification.create({
      userId: patientAlice._id,
      prescriptionId: rxAlice._id,
      medicineName: r.med,
      type: 'medication_reminder',
      channel: 'email',
      title: `Medication Reminder: ${r.med}`,
      message: `Friendly reminder from CareFlow to take your scheduled dose of ${r.med} at ${r.time}.`,
      scheduledFor: new Date(Date.now() + 3600000),
      status: 'scheduled',
    });
  }

  console.log('\n=====================================================');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=====================================================');
  console.log('\n🔑 DEMO ACCOUNTS READY FOR LOG IN:');
  console.log('-----------------------------------------------------');
  console.log('👤 ADMIN:');
  console.log('   Email:    admin@demo.com');
  console.log('   Password: DemoPassword123!\n');
  console.log('🩺 VERIFIED DOCTORS:');
  console.log('   Dr. Rahul Mehta (Gen Med):   doctor@demo.com   / DemoPassword123!');
  console.log('   Dr. Aisha Verma (Cardio):    doctor.aisha@demo.com / DemoPassword123!');
  console.log('   Dr. Neha Sharma (Derm):      doctor.neha@demo.com  / DemoPassword123!');
  console.log('   Dr. Arjun Kapoor (Pediatrics): doctor.arjun@demo.com / DemoPassword123!\n');
  console.log('⏳ PENDING VERIFICATION DOCTOR:');
  console.log('   Dr. Priya Nair (Ortho):      doctor.priya@demo.com / DemoPassword123!\n');
  console.log('👥 DEMO PATIENTS:');
  console.log('   Alice Johnson: patient.a@demo.com / DemoPassword123!');
  console.log('   Robert Davis:  patient.b@demo.com / DemoPassword123!');
  console.log('   Charlie Miller: patient.c@demo.com / DemoPassword123!');
  console.log('=====================================================\n');

  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Seeding Error:', err);
  process.exit(1);
});
