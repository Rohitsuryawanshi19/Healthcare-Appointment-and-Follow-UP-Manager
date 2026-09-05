const {
  generatePreVisitSummary,
  generatePostVisitSummary,
  generateHeuristicFallback,
  generatePostVisitHeuristic,
  PRE_VISIT_DISCLAIMER,
  POST_VISIT_DISCLAIMER,
} = require('../services/aiService');

describe('AI Clinical Engine & Heuristic Fallback Suite', () => {
  describe('Rule-Based Pre-Visit Heuristic Fallback Engine', () => {
    it('should assign High urgency for red-flag cardiovascular/respiratory symptoms', () => {
      const fallback = generateHeuristicFallback('Severe chest pain radiating to left arm and shortness of breath');
      expect(fallback.urgency).toBe('High');
      expect(fallback.status).toBe('fallback');
      expect(fallback.disclaimer).toBe(PRE_VISIT_DISCLAIMER);
      expect(fallback.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should assign Medium urgency for moderate symptoms like fever and persistent migraine', () => {
      const fallback = generateHeuristicFallback('Experiencing high fever and persistent migraine for 3 days');
      expect(fallback.urgency).toBe('Medium');
      expect(fallback.status).toBe('fallback');
      expect(fallback.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should assign Low urgency for routine health inquiries', () => {
      const fallback = generateHeuristicFallback('Need routine annual blood work checkup');
      expect(fallback.urgency).toBe('Low');
      expect(fallback.status).toBe('fallback');
      expect(fallback.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should handle empty or null symptoms gracefully without crashing', () => {
      const fallback = generateHeuristicFallback('');
      expect(fallback).toBeDefined();
      expect(fallback.urgency).toBe('Low');
      expect(fallback.status).toBe('fallback');
    });
  });

  describe('Rule-Based Post-Visit Heuristic Fallback Engine', () => {
    it('should generate structured 5-part care plan from doctor notes and prescriptions', () => {
      const payload = {
        diagnosis: 'Seasonal allergic rhinitis',
        doctorNotes: 'Patient experiencing nasal congestion and sneezing. Prescribed antihistamines.',
        medicines: [
          {
            name: 'Cetirizine',
            dosage: '10mg',
            frequency: 'Once daily at bedtime',
            duration: '10 days',
            timing: 'after_meal',
          },
        ],
        followUpInstructions: 'Return in 2 weeks if symptoms do not improve.',
      };

      const fallback = generatePostVisitHeuristic(payload);
      expect(fallback.status).toBe('fallback');
      expect(fallback.whatWasDiscussed).toContain('rhinitis');
      expect(fallback.medicationSchedule.length).toBe(1);
      expect(fallback.medicationSchedule[0]).toContain('Cetirizine');
      expect(fallback.importantInstructions).toBeInstanceOf(Array);
      expect(fallback.followUpSteps).toBeDefined();
      expect(fallback.whenToSeekHelp).toBeDefined();
      expect(fallback.disclaimer).toBe(POST_VISIT_DISCLAIMER);
    });
  });

  describe('Service Fallback Resiliency on API Disconnection', () => {
    it('should fall back gracefully to heuristic triage when GEMINI_API_KEY is not configured or fails', async () => {
      const result = await generatePreVisitSummary('Sudden sharp knee pain after soccer match');
      expect(result).toBeDefined();
      expect(result.chiefComplaint).toBeDefined();
      expect(result.urgency).toBeDefined();
      expect(result.suggestedQuestions).toBeInstanceOf(Array);
      expect(result.disclaimer).toBe(PRE_VISIT_DISCLAIMER);
    });

    it('should fall back gracefully on post-visit summary without throwing', async () => {
      const result = await generatePostVisitSummary({
        diagnosis: 'Acute Bronchitis',
        doctorNotes: 'Patient recovering well. Mild persistent cough.',
        medicines: [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'TID', duration: '7 days' }],
        followUpInstructions: 'Rest and hydrate.',
      });
      expect(result).toBeDefined();
      expect(result.whatWasDiscussed).toBeDefined();
      expect(result.medicationSchedule).toBeInstanceOf(Array);
      expect(result.disclaimer).toBe(POST_VISIT_DISCLAIMER);
    });
  });
});
