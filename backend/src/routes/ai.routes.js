const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { aiChatLimiter } = require('../middleware/rateLimiter.middleware');

// All AI operations require authentication
router.use(requireAuth);

// POST /api/ai/pre-visit-summary
router.post('/pre-visit-summary', aiController.getPreVisitSummary);

// POST /api/ai/post-visit-summary
router.post('/post-visit-summary', aiController.getPostVisitSummary);

// POST /api/ai/chat (Interactive streaming symptom triage assistant)
router.post('/chat', aiChatLimiter, aiController.chatWithPatient);

module.exports = router;
