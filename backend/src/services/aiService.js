const {
  AI_MODEL,
  getGenAIClient,
  medicalSafetySettings,
  preVisitResponseSchema,
  postVisitResponseSchema,
  defaultGenerationConfig,
} = require('../config/aiConfig');

const PRE_VISIT_DISCLAIMER =
  'AI-generated informational summary. This does not constitute a medical diagnosis.';
const POST_VISIT_DISCLAIMER =
  "This summary is generated from your clinician's notes. Follow your clinician's instructions.";
const CHAT_SYSTEM_INSTRUCTION =
  `You are CareFlow AI, an intelligent, empathetic pre-consultation symptom exploration assistant.
Guidelines:
1. Help the patient describe and organize their symptoms clearly before they book or attend their doctor visit.
2. Discuss general health information and symptom urgency (Low, Moderate, Urgent).
3. NEVER provide a definitive medical diagnosis, and NEVER prescribe or suggest specific medication dosages.
4. If the patient mentions emergency red-flag symptoms (such as acute chest pain radiating to the arm, sudden facial drooping/speech slurring, severe respiratory distress, or sudden loss of vision), immediately advise them to contact emergency emergency services or visit the nearest emergency room without delay.
5. Always advise consulting a qualified doctor through CareFlow for personalized diagnostic evaluation.
6. Keep your tone professional, concise, reassuring, and clear.`;

/**
 * Intelligent Rule-based Medical Heuristic Fallback Engine for Pre-Visit Triage
 */
function generateHeuristicFallback(symptomsText = '', reason = 'Heuristic fallback') {
  const text = (symptomsText || '').toLowerCase();

  let urgency = 'Low';
  let chiefComplaint = 'General medical inquiry and wellness checkup.';
  const suggestedQuestions = [];

  const highRiskKeywords = [
    'chest pain',
    'shortness of breath',
    'difficulty breathing',
    'palpitation',
    'fainting',
    'severe headache',
    'sudden weakness',
    'numbness',
    'vision loss',
  ];
  const mediumRiskKeywords = [
    'migraine',
    'fever',
    'persistent cough',
    'vomiting',
    'abdominal pain',
    'rash',
    'dizziness',
    'joint pain',
    'hypertension',
    'blood pressure',
  ];

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
    fallbackReason: reason,
  };
}

/**
 * Intelligent Rule-based Heuristic Engine for Post-Visit Patient Care Summary
 */
function generatePostVisitHeuristic(
  { diagnosis, doctorNotes, medicines = [], followUpInstructions },
  reason = 'Heuristic fallback'
) {
  const whatWasDiscussed = diagnosis
    ? `Your doctor assessed your symptoms and diagnosed: ${diagnosis}. Notes: ${doctorNotes || 'Consultation concluded.'}`
    : `Clinical consultation summary: ${doctorNotes || 'Standard medical assessment conducted.'}`;

  const medicationSchedule =
    Array.isArray(medicines) && medicines.length > 0
      ? medicines.map((m) => {
          const timingFormatted = m.timing ? ` (${m.timing.replace('_', ' ')})` : '';
          const instrFormatted = m.instructions ? ` - ${m.instructions}` : '';
          return `${m.name} ${m.dosage}: Take ${m.frequency} for ${m.duration}${timingFormatted}${instrFormatted}.`;
        })
      : ['No new prescription medications prescribed during this visit.'];

  const importantInstructions = [
    'Take all prescribed medications precisely as directed by your physician.',
    'Ensure adequate rest, balanced hydration, and avoid strenuous overexertion.',
    followUpInstructions
      ? `Follow clinician guidance: ${followUpInstructions}`
      : 'Contact the clinic if symptoms do not improve within expected duration.',
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
    fallbackReason: reason,
  };
}

/**
 * Helper to run an async operation with an Abort timeout
 */
async function withTimeout(promise, ms = 8000, correlationId = '') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI generation timed out after ${ms}ms [correlationId: ${correlationId}]`));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Generates structured AI pre-visit symptom summary using official @google/genai SDK
 */
async function generatePreVisitSummary(symptoms, options = {}) {
  const correlationId = options.correlationId || `pre_${Date.now()}`;

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
    return generateHeuristicFallback(symptoms, 'Simulated timeout');
  }

  if (options.forceMalformed) {
    return generateHeuristicFallback(symptoms, 'Simulated malformed response');
  }

  const aiClient = getGenAIClient();
  if (!aiClient) {
    return generateHeuristicFallback(symptoms, 'GEMINI_API_KEY not configured');
  }

  const promptText = `Analyze these patient symptoms and extract the triage urgency, chief complaint summary, and 3 clinical inquiries for the doctor:\n\nPatient Symptoms:\n${symptoms}`;

  try {
    const aiCall = aiClient.models.generateContent({
      model: AI_MODEL,
      contents: promptText,
      config: {
        ...defaultGenerationConfig,
        safetySettings: medicalSafetySettings,
        responseMimeType: 'application/json',
        responseSchema: preVisitResponseSchema,
      },
    });

    const response = await withTimeout(aiCall, 8000, correlationId);
    const rawText = response.text;

    if (!rawText) {
      throw new Error('Empty text received from AI model');
    }

    const parsed = JSON.parse(rawText);

    let urgency = 'Low';
    if (parsed.urgency) {
      const u = String(parsed.urgency).toLowerCase();
      if (u.includes('high') || u.includes('emergency')) urgency = 'High';
      else if (u.includes('medium') || u.includes('moderate')) urgency = 'Medium';
      else urgency = 'Low';
    }

    return {
      urgency,
      chiefComplaint: parsed.chiefComplaint || symptoms.substring(0, 120),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) && parsed.suggestedQuestions.length >= 3
        ? parsed.suggestedQuestions.slice(0, 3)
        : [
            'How long have you experienced these symptoms?',
            'What makes the symptoms better or worse?',
            'Are you taking any current medications?',
          ],
      disclaimer: PRE_VISIT_DISCLAIMER, // Always enforce system disclaimer
      status: 'completed',
    };
  } catch (error) {
    console.error(`[AI Service Error - ${correlationId}] Pre-visit generation failed:`, error.message);
    return generateHeuristicFallback(symptoms, error.message);
  }
}

/**
 * Generates patient-friendly Post-Visit Care Summary using official @google/genai SDK
 */
async function generatePostVisitSummary(
  { diagnosis, doctorNotes, medicines = [], followUpInstructions },
  options = {}
) {
  const correlationId = options.correlationId || `post_${Date.now()}`;

  if (options.forceTimeout || options.forceMalformed) {
    return generatePostVisitHeuristic(
      { diagnosis, doctorNotes, medicines, followUpInstructions },
      options.forceTimeout ? 'Simulated timeout' : 'Simulated malformed response'
    );
  }

  const aiClient = getGenAIClient();
  if (!aiClient) {
    return generatePostVisitHeuristic(
      { diagnosis, doctorNotes, medicines, followUpInstructions },
      'GEMINI_API_KEY not configured'
    );
  }

  const medsText =
    Array.isArray(medicines) && medicines.length > 0
      ? medicines
          .map(
            (m) =>
              `- ${m.name} (${m.dosage}): ${m.frequency} for ${m.duration}, Timing: ${m.timing || 'after_meal'}. ${m.instructions || ''}`
          )
          .join('\n')
      : 'None prescribed';

  const promptText = `You are a clinical communications specialist. Transform this doctor's consultation notes into a patient-friendly care plan. Do NOT alter medications or diagnoses.

Diagnosis: ${diagnosis || 'Clinical evaluation'}
Doctor Notes: ${doctorNotes || 'Consultation concluded.'}
Prescribed Medications:
${medsText}
Follow-up Instructions: ${followUpInstructions || 'Standard monitoring'}`;

  try {
    const aiCall = aiClient.models.generateContent({
      model: AI_MODEL,
      contents: promptText,
      config: {
        ...defaultGenerationConfig,
        safetySettings: medicalSafetySettings,
        responseMimeType: 'application/json',
        responseSchema: postVisitResponseSchema,
      },
    });

    const response = await withTimeout(aiCall, 8000, correlationId);
    const rawText = response.text;

    if (!rawText) {
      throw new Error('Empty response received from AI model');
    }

    const parsed = JSON.parse(rawText);

    return {
      whatWasDiscussed: parsed.whatWasDiscussed || 'Clinical visit concluded with tailored health guidance.',
      medicationSchedule: Array.isArray(parsed.medicationSchedule) ? parsed.medicationSchedule : [],
      importantInstructions: Array.isArray(parsed.importantInstructions) ? parsed.importantInstructions : [],
      followUpSteps: parsed.followUpSteps || followUpInstructions || 'Follow up with your clinician as directed.',
      whenToSeekHelp:
        parsed.whenToSeekHelp || 'Seek immediate medical attention if symptoms worsen suddenly or red-flag signs appear.',
      disclaimer: POST_VISIT_DISCLAIMER, // Always enforce system disclaimer
      status: 'completed',
    };
  } catch (error) {
    console.error(`[AI Service Error - ${correlationId}] Post-visit generation failed:`, error.message);
    return generatePostVisitHeuristic(
      { diagnosis, doctorNotes, medicines, followUpInstructions },
      error.message
    );
  }
}

/**
 * Interactive streaming symptom triage assistant for patients before booking
 * Yields text tokens in real time
 */
async function* streamPatientChat({ message, history = [] }, options = {}) {
  const correlationId = options.correlationId || `chat_${Date.now()}`;
  const aiClient = getGenAIClient();

  if (!aiClient) {
    // Graceful offline fallback stream
    const fallbackResponse = `Thank you for sharing your symptoms: "${message}".\n\nCareFlow Recommendation:\n• For accurate clinical diagnosis, please schedule a consultation with one of our verified specialists.\n• If you are experiencing sudden severe chest pain, shortness of breath, or numbness, please seek emergency medical attention immediately.\n\n*Disclaimer: CareFlow AI provides general health information and is not a substitute for professional clinical advice.*`;
    for (const char of fallbackResponse.split(' ')) {
      yield char + ' ';
      await new Promise((r) => setTimeout(r, 20));
    }
    return;
  }

  // Build conversation history (strictly capped to last 10 turns)
  const formattedContents = [];

  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  for (const turn of recentHistory) {
    if (turn.role === 'user' || turn.role === 'patient') {
      formattedContents.push({ role: 'user', parts: [{ text: String(turn.content || turn.message) }] });
    } else if (turn.role === 'model' || turn.role === 'assistant') {
      formattedContents.push({ role: 'model', parts: [{ text: String(turn.content || turn.message) }] });
    }
  }

  // Append current user message
  formattedContents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const stream = await aiClient.models.generateContentStream({
      model: AI_MODEL,
      contents: formattedContents,
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.4,
        maxOutputTokens: 800,
        safetySettings: medicalSafetySettings,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error(`[AI Chat Stream Error - ${correlationId}]:`, error.message);
    yield `\n\n[Notice: Connectivity issue. For your symptoms, please book an appointment with a verified CareFlow doctor for a comprehensive medical assessment.]\n\n*${PRE_VISIT_DISCLAIMER}*`;
  }
}

module.exports = {
  generatePreVisitSummary,
  generatePostVisitSummary,
  streamPatientChat,
  generateHeuristicFallback,
  generatePostVisitHeuristic,
  PRE_VISIT_DISCLAIMER,
  POST_VISIT_DISCLAIMER,
};
