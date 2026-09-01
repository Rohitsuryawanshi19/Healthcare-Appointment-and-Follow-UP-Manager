const PRE_VISIT_DISCLAIMER = 'AI-generated informational summary. This does not constitute a medical diagnosis.';
const POST_VISIT_DISCLAIMER = "This summary is generated from your clinician's notes. Follow your clinician's instructions.";

/**
 * Intelligent Rule-based Medical Heuristic Fallback Engine for Pre-Visit Triage
 */
function generateHeuristicFallback(symptomsText = '') {
  const text = (symptomsText || '').toLowerCase();

  let urgency = 'Low';
  let chiefComplaint = 'General medical inquiry and wellness checkup.';
  const suggestedQuestions = [];

  const highRiskKeywords = ['chest pain', 'shortness of breath', 'difficulty breathing', 'palpitation', 'fainting', 'severe headache', 'sudden weakness', 'numbness', 'vision loss'];
  const mediumRiskKeywords = ['migraine', 'fever', 'persistent cough', 'vomiting', 'abdominal pain', 'rash', 'dizziness', 'joint pain', 'hypertension', 'blood pressure'];

  const hasHighRisk = highRiskKeywords.some((k) => text.includes(k));
  const hasMediumRisk = mediumRiskKeywords.some((k) => text.includes(k));

  if (hasHighRisk) {
    urgency = 'High';
    chiefComplaint = `Acute symptoms requiring prioritized clinical evaluation: ${symptomsText.substring(0, 100)}...`;
    suggestedQuestions.push('How long have these severe symptoms persisted and do they occur at rest?');
    suggestedQuestions.push('Are there associated symptoms such as diaphoresis, radiating pain, or nausea?');
    suggestedQuestions.push('Do you have a personal or family history of cardiovascular or neurological conditions?');
  } else if (hasMediumRisk) {
    urgency = 'Medium';
    chiefComplaint = `Subacute discomfort and symptoms: ${symptomsText.substring(0, 100)}...`;
    suggestedQuestions.push('What triggers or alleviates the intensity of these symptoms?');
    suggestedQuestions.push('Have you taken any over-the-counter or prescribed medications for relief?');
    suggestedQuestions.push('Have you experienced similar episodes in the past?');
  } else {
    urgency = 'Low';
    chiefComplaint = symptomsText.trim()
      ? `Reported symptoms: ${symptomsText.substring(0, 120)}`
      : 'Routine clinical consultation and health review.';
    suggestedQuestions.push('When did you first notice these symptoms?');
    suggestedQuestions.push('Are your daily activities, appetite, or sleep impacted?');
    suggestedQuestions.push('Are there any other health changes you would like to discuss today?');
  }

  return {
    urgency,
    chiefComplaint,
    suggestedQuestions: suggestedQuestions.slice(0, 3),
    disclaimer: PRE_VISIT_DISCLAIMER,
    status: 'fallback',
  };
}

/**
 * Intelligent Rule-based Heuristic Engine for Post-Visit Patient Care Summary
 * Formats doctor observations and prescription faithfully without altering treatment.
 */
function generatePostVisitHeuristic({ diagnosis, doctorNotes, medicines = [], followUpInstructions }) {
  const whatWasDiscussed = diagnosis
    ? `Your doctor assessed your symptoms and diagnosed: ${diagnosis}. Notes: ${doctorNotes || 'Consultation concluded.'}`
    : `Clinical consultation summary: ${doctorNotes || 'Standard medical assessment conducted.'}`;

  const medicationSchedule = Array.isArray(medicines) && medicines.length > 0
    ? medicines.map((m) => {
        const timingFormatted = m.timing ? ` (${m.timing.replace('_', ' ')})` : '';
        const instrFormatted = m.instructions ? ` - ${m.instructions}` : '';
        return `${m.name} ${m.dosage}: Take ${m.frequency} for ${m.duration}${timingFormatted}${instrFormatted}.`;
      })
    : ['No new prescription medications prescribed during this visit.'];

  const importantInstructions = [
    'Take all prescribed medications precisely as directed by your physician.',
    'Ensure adequate rest, balanced hydration, and avoid strenuous overexertion.',
    followUpInstructions ? `Follow clinician guidance: ${followUpInstructions}` : 'Contact the clinic if symptoms do not improve within expected duration.',
  ];

  const followUpSteps = followUpInstructions
    ? followUpInstructions
    : 'Monitor your symptoms daily. Schedule a follow-up consultation if symptoms persist or new concerns arise.';

  const whenToSeekHelp =
    'Seek immediate medical emergency attention if you experience sudden chest pain, severe shortness of breath, sudden weakness or numbness, high unrelenting fever, or severe allergic reactions.';

  return {
    whatWasDiscussed,
    medicationSchedule,
    importantInstructions,
    followUpSteps,
    whenToSeekHelp,
    disclaimer: POST_VISIT_DISCLAIMER,
    status: 'fallback',
  };
}

/**
 * Generates structured AI pre-visit symptom summary
 */
async function generatePreVisitSummary(symptoms, options = {}) {
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === '') {
    return {
      urgency: 'Low',
      chiefComplaint: 'No pre-visit symptoms submitted.',
      suggestedQuestions: [
        'What is the primary reason for your visit today?',
        'Do you have any current health concerns or medications to review?',
        'Are there any preventive health screenings you need?',
      ],
      disclaimer: PRE_VISIT_DISCLAIMER,
      status: 'completed',
    };
  }

  if (options.forceTimeout) {
    return generateHeuristicFallback(symptoms);
  }

  if (options.forceMalformed) {
    return generateHeuristicFallback(symptoms);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    return generateHeuristicFallback(symptoms);
  }

  const promptText = `Analyze these symptoms and return:
* urgency level: Low / Medium / High
* chief complaint
* three suggested questions for the doctor

Symptoms:
${symptoms}

Important safety behavior:
The AI must NOT claim to diagnose the patient.
Add this disclaimer:
"${PRE_VISIT_DISCLAIMER}"

Respond ONLY with valid JSON matching this exact structure:
{
  "urgency": "Low" | "Medium" | "High",
  "chiefComplaint": "Concise summary of main complaint",
  "suggestedQuestions": [
    "Question 1 for doctor",
    "Question 2 for doctor",
    "Question 3 for doctor"
  ],
  "disclaimer": "${PRE_VISIT_DISCLAIMER}"
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return generateHeuristicFallback(symptoms);
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(rawContent);

    let urgency = 'Low';
    if (parsed.urgency) {
      const u = String(parsed.urgency).toLowerCase();
      if (u.includes('high') || u.includes('emergency')) urgency = 'High';
      else if (u.includes('medium') || u.includes('moderate')) urgency = 'Medium';
      else urgency = 'Low';
    }

    return {
      urgency,
      chiefComplaint: parsed.chiefComplaint || symptoms.substring(0, 100),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions.slice(0, 3)
        : [
            'How long have you experienced these symptoms?',
            'What makes the symptoms better or worse?',
            'Are you taking any current medications?',
          ],
      disclaimer: PRE_VISIT_DISCLAIMER,
      status: 'completed',
      rawResponse: rawContent.substring(0, 500),
    };
  } catch (error) {
    return generateHeuristicFallback(symptoms);
  }
}

/**
 * Generates patient-friendly Post-Visit Care Summary
 *
 * @param {Object} clinicalData - { diagnosis, doctorNotes, medicines, followUpInstructions }
 * @param {Object} [options={}] - { forceTimeout, forceMalformed }
 * @returns {Promise<Object>} 5-part structured post-visit summary
 */
async function generatePostVisitSummary({ diagnosis, doctorNotes, medicines = [], followUpInstructions }, options = {}) {
  if (options.forceTimeout || options.forceMalformed) {
    return generatePostVisitHeuristic({ diagnosis, doctorNotes, medicines, followUpInstructions });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    return generatePostVisitHeuristic({ diagnosis, doctorNotes, medicines, followUpInstructions });
  }

  const medsText = Array.isArray(medicines) && medicines.length > 0
    ? medicines.map((m) => `- ${m.name} (${m.dosage}): ${m.frequency} for ${m.duration}, Timing: ${m.timing || 'after_meal'}. ${m.instructions || ''}`).join('\n')
    : 'None';

  const promptText = `You are a medical communicator generating a patient-friendly post-visit care plan.
Summarize the doctor's clinical findings strictly and accurately into plain language.
Do NOT alter the doctor's prescription or invent treatments.

Doctor Assessment / Diagnosis: ${diagnosis || 'Not specified'}
Doctor Clinical Notes: ${doctorNotes || 'Routine consultation concluded.'}
Prescribed Medications:
${medsText}
Follow-up Instructions: ${followUpInstructions || 'Standard follow-up as needed.'}

Return a valid JSON object matching this schema:
{
  "whatWasDiscussed": "Clear, reassuring plain-language summary of the visit and diagnosis",
  "medicationSchedule": [
    "Instruction for medicine 1",
    "Instruction for medicine 2"
  ],
  "importantInstructions": [
    "Key care instruction 1",
    "Key care instruction 2"
  ],
  "followUpSteps": "Clear follow-up guidance and timeline",
  "whenToSeekHelp": "Emergency red-flag warning signs that require urgent medical attention",
  "disclaimer": "${POST_VISIT_DISCLAIMER}"
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return generatePostVisitHeuristic({ diagnosis, doctorNotes, medicines, followUpInstructions });
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(rawContent);

    return {
      whatWasDiscussed: parsed.whatWasDiscussed || 'Clinical visit concluded with tailored health guidance.',
      medicationSchedule: Array.isArray(parsed.medicationSchedule) ? parsed.medicationSchedule : [],
      importantInstructions: Array.isArray(parsed.importantInstructions) ? parsed.importantInstructions : [],
      followUpSteps: parsed.followUpSteps || followUpInstructions || 'Follow up as directed.',
      whenToSeekHelp: parsed.whenToSeekHelp || 'Seek immediate medical attention if symptoms worsen suddenly.',
      disclaimer: POST_VISIT_DISCLAIMER,
      status: 'completed',
    };
  } catch (error) {
    return generatePostVisitHeuristic({ diagnosis, doctorNotes, medicines, followUpInstructions });
  }
}

module.exports = {
  generatePreVisitSummary,
  generatePostVisitSummary,
  generateHeuristicFallback,
  generatePostVisitHeuristic,
  PRE_VISIT_DISCLAIMER,
  POST_VISIT_DISCLAIMER,
};
