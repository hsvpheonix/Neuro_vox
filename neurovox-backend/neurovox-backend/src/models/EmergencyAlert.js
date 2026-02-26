const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alertType: {
    type: String,
    enum: ['sos', 'fall_detected', 'seizure', 'cardiac', 'manual', 'brain_signal', 'custom'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  message: { type: String },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'false_alarm'],
    default: 'active'
  },
  notifiedContacts: [{
    name: String,
    phone: String,
    email: String,
    notifiedAt: Date,
    method: { type: String, enum: ['sms', 'email', 'call', 'app'] }
  }],
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  notes: { type: String },
  brainSignalId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrainSignal' }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
