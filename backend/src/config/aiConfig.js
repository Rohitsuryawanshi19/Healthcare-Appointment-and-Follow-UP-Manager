const { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } = require('@google/genai');

// Model auto-tracks Google's current fast recommended model
const AI_MODEL = process.env.LLM_MODEL || 'gemini-flash-latest';

/**
 * Get configured GoogleGenAI SDK client
 */
function getGenAIClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.LLM_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Safety settings tailored for healthcare communications:
 * Blocks harmful abuse while allowing clinical and symptom discussions without false triggers.
 */
const medicalSafetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

/**
 * Structured response schema for Pre-Visit Triage Summary
 */
const preVisitResponseSchema = {
  type: Type.OBJECT,
  properties: {
    urgency: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
      description: 'Clinical urgency level for consultation priority',
    },
    chiefComplaint: {
      type: Type.STRING,
      description: 'Concise summary of main medical symptoms and chief complaint',
    },
    suggestedQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Three structured diagnostic questions for the physician',
    },
    disclaimer: {
      type: Type.STRING,
      description: 'Mandatory clinical disclaimer',
    },
  },
  required: ['urgency', 'chiefComplaint', 'suggestedQuestions', 'disclaimer'],
};

/**
 * Structured response schema for Post-Visit Care Summary
 */
const postVisitResponseSchema = {
  type: Type.OBJECT,
  properties: {
    whatWasDiscussed: {
      type: Type.STRING,
      description: 'Clear, reassuring plain-language summary of assessment and diagnosis',
    },
    medicationSchedule: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Formatted plain-language medication directions',
    },
    importantInstructions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Key recovery lifestyle instructions and cautions',
    },
    followUpSteps: {
      type: Type.STRING,
      description: 'Follow-up timeline and clinic check-in directions',
    },
    whenToSeekHelp: {
      type: Type.STRING,
      description: 'Emergency red-flag signs requiring immediate medical intervention',
    },
    disclaimer: {
      type: Type.STRING,
      description: 'Mandatory post-visit clinical disclaimer',
    },
  },
  required: [
    'whatWasDiscussed',
    'medicationSchedule',
    'importantInstructions',
    'followUpSteps',
    'whenToSeekHelp',
    'disclaimer',
  ],
};

const defaultGenerationConfig = {
  temperature: 0.3,
  topP: 0.95,
  maxOutputTokens: 1024,
};

module.exports = {
  AI_MODEL,
  getGenAIClient,
  medicalSafetySettings,
  preVisitResponseSchema,
  postVisitResponseSchema,
  defaultGenerationConfig,
};
