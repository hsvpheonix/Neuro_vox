const mongoose = require('mongoose');

const brainSignalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String },
  timestamp: { type: Date, default: Date.now },

  // Raw signal data
  rawSignal: {
    alpha: { type: Number }, // 8-12 Hz - relaxed focus
    beta: { type: Number },  // 12-30 Hz - active thinking
    theta: { type: Number }, // 4-8 Hz - drowsiness/creativity
    delta: { type: Number }, // 0.5-4 Hz - deep sleep
    gamma: { type: Number }  // 30+ Hz - high cognition
  },

  // Processed output
  translatedText: { type: String },
  translatedSpeechUrl: { type: String },
  confidence: { type: Number, min: 0, max: 100 },

  // Emotional state
  emotionalState: {
    type: String,
    enum: ['calm', 'focused', 'stressed', 'anxious', 'happy', 'sad', 'neutral', 'excited'],
    default: 'neutral'
  },
  emotionIntensity: { type: Number, min: 0, max: 100 },

  // Cognitive state
  cognitiveLoad: { type: Number, min: 0, max: 100 },
  attentionLevel: { type: Number, min: 0, max: 100 },
  fatigueLevel: { type: Number, min: 0, max: 100 },

  sessionId: { type: String },
  isEmergency: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('BrainSignal', brainSignalSchema);
