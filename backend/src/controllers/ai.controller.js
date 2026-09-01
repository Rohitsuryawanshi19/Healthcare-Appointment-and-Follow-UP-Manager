const mongoose = require('mongoose');
const { Appointment, Prescription } = require('../models');
const {
  generatePreVisitSummary,
  generatePostVisitSummary,
  PRE_VISIT_DISCLAIMER,
  POST_VISIT_DISCLAIMER,
} = require('../services/aiService');

// @desc    Generate structured AI pre-visit summary from symptoms
// @route   POST /api/ai/pre-visit-summary
// @access  Private (Patient, Doctor, or Admin)
exports.getPreVisitSummary = async (req, res, next) => {
  try {
    const { symptoms, appointmentId, mockMode } = req.body;

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Patient symptoms text is required.',
      });
    }

    const options = {};
    if (mockMode === 'timeout') options.forceTimeout = true;
    if (mockMode === 'malformed') options.forceMalformed = true;

    const summary = await generatePreVisitSummary(symptoms, options);

    // If appointmentId provided, store AI summary inside the appointment
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        aiSummary: {
          chiefComplaint: summary.chiefComplaint,
          triageUrgency: summary.urgency,
          suggestedQuestions: summary.suggestedQuestions,
          disclaimer: summary.disclaimer || PRE_VISIT_DISCLAIMER,
          status: summary.status || 'completed',
          generatedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        urgency: summary.urgency,
        chiefComplaint: summary.chiefComplaint,
        suggestedQuestions: summary.suggestedQuestions,
        disclaimer: summary.disclaimer || PRE_VISIT_DISCLAIMER,
        status: summary.status,
      },
    });
  } catch (error) {
    console.error('Unhandled AI controller exception:', error);
    res.status(200).json({
      success: true,
      data: {
        urgency: 'Low',
        chiefComplaint: 'Clinical symptoms recorded.',
        suggestedQuestions: [
          'What is the primary duration of your symptoms?',
          'Are there any known triggers?',
          'What relief measures have been attempted?',
        ],
        disclaimer: PRE_VISIT_DISCLAIMER,
        status: 'fallback',
      },
    });
  }
};

// @desc    Generate patient-friendly AI Post-Visit Care Summary
// @route   POST /api/ai/post-visit-summary
// @access  Private (Patient, Doctor, or Admin)
exports.getPostVisitSummary = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, doctorNotes, medicines, followUpInstructions, mockMode } = req.body;

    let targetDiagnosis = diagnosis;
    let targetDoctorNotes = doctorNotes;
    let targetMedicines = medicines || [];
    let targetFollowUp = followUpInstructions;
    let appointmentDoc = null;

    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      appointmentDoc = await Appointment.findById(appointmentId).populate('prescriptionId');
      if (!appointmentDoc) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      // Authorization: patient, assigned doctor, or admin
      const isPatient = String(appointmentDoc.patientId) === String(req.user._id);
      const isDoctor = String(appointmentDoc.doctorId?.userId || appointmentDoc.doctorId) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';

      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Unauthorized to access this consultation record.' });
      }

      targetDiagnosis = targetDiagnosis || appointmentDoc.diagnosis;
      targetDoctorNotes = targetDoctorNotes || appointmentDoc.doctorNotes;
      targetFollowUp = targetFollowUp || appointmentDoc.followUpInstructions;

      if (!targetMedicines.length && appointmentDoc.prescriptionId?.medicines?.length) {
        targetMedicines = appointmentDoc.prescriptionId.medicines;
      }
    }

    const options = {};
    if (mockMode === 'timeout') options.forceTimeout = true;
    if (mockMode === 'malformed') options.forceMalformed = true;

    const summary = await generatePostVisitSummary(
      {
        diagnosis: targetDiagnosis,
        doctorNotes: targetDoctorNotes,
        medicines: targetMedicines,
        followUpInstructions: targetFollowUp,
      },
      options
    );

    // Store in MongoDB if appointmentId was provided
    if (appointmentDoc) {
      appointmentDoc.postVisitSummary = {
        whatWasDiscussed: summary.whatWasDiscussed,
        medicationSchedule: summary.medicationSchedule,
        importantInstructions: summary.importantInstructions,
        followUpSteps: summary.followUpSteps,
        whenToSeekHelp: summary.whenToSeekHelp,
        disclaimer: summary.disclaimer || POST_VISIT_DISCLAIMER,
        status: summary.status || 'completed',
        generatedAt: new Date(),
      };
      await appointmentDoc.save();
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Unhandled Post-Visit AI controller exception:', error);
    res.status(200).json({
      success: true,
      data: {
        whatWasDiscussed: 'Consultation concluded. Follow all clinician instructions as recorded.',
        medicationSchedule: [],
        importantInstructions: ['Follow your doctor prescribed regimen.'],
        followUpSteps: 'Contact clinic if symptoms persist.',
        whenToSeekHelp: 'Seek emergency medical attention if severe red-flag symptoms occur.',
        disclaimer: POST_VISIT_DISCLAIMER,
        status: 'fallback',
      },
    });
  }
};
