const BrainSignal = require('../models/BrainSignal');
const EmergencyAlert = require('../models/EmergencyAlert');
const { v4: uuidv4 } = require('uuid');

// POST /api/brain/signal - Ingest a brain signal reading from device
exports.ingestSignal = async (req, res, next) => {
  try {
    const { rawSignal, sessionId, deviceId } = req.body;

    // Simulate translation (replace with real ML model in production)
    const translatedText = simulateTranslation(rawSignal);
    const emotionalState = detectEmotion(rawSignal);
    const confidence = Math.floor(70 + Math.random() * 30);

    const signal = await BrainSignal.create({
      userId: req.user.id,
      deviceId: deviceId || req.user.deviceId,
      rawSignal,
      translatedText,
      confidence,
      emotionalState: emotionalState.state,
      emotionIntensity: emotionalState.intensity,
      cognitiveLoad: calculateCognitiveLoad(rawSignal),
      attentionLevel: calculateAttention(rawSignal),
      fatigueLevel: calculateFatigue(rawSignal),
      sessionId: sessionId || uuidv4()
    });

    // Auto-trigger emergency if distress detected
    if (emotionalState.state === 'stressed' && emotionalState.intensity > 80) {
      await EmergencyAlert.create({
        userId: req.user.id,
        alertType: 'brain_signal',
        severity: 'high',
        message: 'High stress detected via brain signal monitoring.',
        brainSignalId: signal._id
      });
      signal.isEmergency = true;
      await signal.save();
    }

    res.status(201).json({ success: true, signal });
  } catch (error) {
    next(error);
  }
};

// GET /api/brain/history - Get user's signal history
exports.getSignalHistory = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, sessionId, from, to } = req.query;
    const query = { userId: req.user.id };

    if (sessionId) query.sessionId = sessionId;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const signals = await BrainSignal.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await BrainSignal.countDocuments(query);

    res.json({ success: true, signals, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// GET /api/brain/live - Get latest live signal (polling)
exports.getLiveSignal = async (req, res, next) => {
  try {
    const signal = await BrainSignal.findOne({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json({ success: true, signal });
  } catch (error) {
    next(error);
  }
};

// POST /api/brain/translate - Translate text to speech (text-to-speech endpoint)
exports.translateToSpeech = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required.' });

    // In production: integrate with Google TTS, Amazon Polly, etc.
    res.json({
      success: true,
      message: 'Speech synthesis queued.',
      text,
      audioUrl: null, // Will be a real URL in production
      hint: 'Integrate with Google Text-to-Speech or Amazon Polly for actual audio synthesis.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/brain/stats - Get brain signal statistics for dashboard
exports.getStats = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const from = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const signals = await BrainSignal.find({
      userId: req.user.id,
      timestamp: { $gte: from }
    });

    if (!signals.length) {
      return res.json({ success: true, stats: {}, message: 'No signals found for this period.' });
    }

    const stats = {
      totalReadings: signals.length,
      avgConfidence: avg(signals.map(s => s.confidence)),
      avgCognitiveLoad: avg(signals.map(s => s.cognitiveLoad)),
      avgAttentionLevel: avg(signals.map(s => s.attentionLevel)),
      avgFatigueLevel: avg(signals.map(s => s.fatigueLevel)),
      emotionBreakdown: getEmotionBreakdown(signals),
      avgBrainWaves: {
        alpha: avg(signals.map(s => s.rawSignal?.alpha).filter(Boolean)),
        beta: avg(signals.map(s => s.rawSignal?.beta).filter(Boolean)),
        theta: avg(signals.map(s => s.rawSignal?.theta).filter(Boolean)),
        delta: avg(signals.map(s => s.rawSignal?.delta).filter(Boolean)),
        gamma: avg(signals.map(s => s.rawSignal?.gamma).filter(Boolean)),
      },
      emergencyCount: signals.filter(s => s.isEmergency).length
    };

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simulateTranslation(rawSignal) {
  if (!rawSignal) return 'No signal detected';
  const phrases = [
    'I need help', 'I am okay', 'Thank you', 'Yes', 'No',
    'I am in pain', 'Please call the doctor', 'I am thirsty',
    'I need rest', 'I feel good today'
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function detectEmotion(rawSignal) {
  if (!rawSignal) return { state: 'neutral', intensity: 50 };
  const { beta = 0, alpha = 0, theta = 0 } = rawSignal;
  let state = 'neutral', intensity = 50;
  if (beta > 25) { state = 'stressed'; intensity = Math.min(100, beta * 2); }
  else if (alpha > 10) { state = 'calm'; intensity = Math.min(100, alpha * 5); }
  else if (theta > 6) { state = 'anxious'; intensity = Math.min(100, theta * 8); }
  return { state, intensity };
}

function calculateCognitiveLoad(rawSignal) {
  if (!rawSignal) return 50;
  return Math.min(100, Math.floor(((rawSignal.beta || 0) / 30) * 100));
}

function calculateAttention(rawSignal) {
  if (!rawSignal) return 50;
  return Math.min(100, Math.floor(((rawSignal.gamma || 0) / 40) * 100));
}

function calculateFatigue(rawSignal) {
  if (!rawSignal) return 50;
  return Math.min(100, Math.floor(((rawSignal.theta || 0) / 8) * 100));
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + (b || 0), 0) / arr.length);
}

function getEmotionBreakdown(signals) {
  const breakdown = {};
  signals.forEach(s => {
    if (s.emotionalState) {
      breakdown[s.emotionalState] = (breakdown[s.emotionalState] || 0) + 1;
    }
  });
  return breakdown;
}
