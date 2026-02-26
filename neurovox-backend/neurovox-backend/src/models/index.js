const mongoose = require('mongoose');

// ─── Mind Log ───────────────────────────────────────────────────────────────
const mindLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'bad', 'terrible'],
    default: 'okay'
  },
  tags: [{ type: String }],
  sentiment: {
    score: { type: Number },      // -1 to 1
    label: { type: String }       // positive / neutral / negative
  },
  isPrivate: { type: Boolean, default: true },
  attachments: [{ type: String }]
}, { timestamps: true });

// ─── Appointment ─────────────────────────────────────────────────────────────
const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hospitalName: { type: String },
  hospitalAddress: { type: String },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  type: {
    type: String,
    enum: ['consultation', 'therapy', 'emergency', 'follow_up', 'checkup'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  reason: { type: String },
  notes: { type: String },
  meetingLink: { type: String }, // for online appointments
  isOnline: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

// ─── Therapy Session ──────────────────────────────────────────────────────────
const therapySessionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionType: {
    type: String,
    enum: ['speech', 'cognitive', 'emotional', 'physical', 'group'],
    default: 'speech'
  },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // minutes
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  sessionNotes: { type: String },
  progressScore: { type: Number, min: 0, max: 100 },
  exercises: [{ name: String, completed: Boolean, score: Number }],
  recordingUrl: { type: String },
  meetingLink: { type: String },
  homeworkAssigned: { type: String },
  nextSessionDate: { type: Date }
}, { timestamps: true });

// ─── Health Report ────────────────────────────────────────────────────────────
const healthReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // doctor or auto
  reportType: {
    type: String,
    enum: ['weekly', 'monthly', 'custom', 'emergency'],
    default: 'weekly'
  },
  period: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  summary: { type: String },
  brainActivity: {
    avgAlpha: Number, avgBeta: Number, avgTheta: Number, avgDelta: Number, avgGamma: Number,
    dominantState: String
  },
  emotionalSummary: {
    mostFrequentEmotion: String,
    emotionBreakdown: mongoose.Schema.Types.Mixed
  },
  communicationStats: {
    totalTranslations: Number,
    avgConfidence: Number,
    wordsGenerated: Number
  },
  emergencyAlerts: {
    total: Number,
    resolved: Number
  },
  doctorNotes: { type: String },
  recommendations: [{ type: String }],
  pdfUrl: { type: String },
  isSharedWithDoctor: { type: Boolean, default: false }
}, { timestamps: true });

// ─── Technician Ticket ────────────────────────────────────────────────────────
const technicianTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String },
  issueType: {
    type: String,
    enum: ['connectivity', 'calibration', 'hardware', 'software', 'signal_quality', 'other'],
    required: true
  },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  resolution: { type: String },
  attachments: [{ type: String }],
  resolvedAt: { type: Date }
}, { timestamps: true });

// ─── Resource ─────────────────────────────────────────────────────────────────
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['guide', 'tutorial', 'research', 'support', 'faq', 'video', 'article'],
    default: 'guide'
  },
  url: { type: String },
  fileUrl: { type: String },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
  MindLog: mongoose.model('MindLog', mindLogSchema),
  Appointment: mongoose.model('Appointment', appointmentSchema),
  TherapySession: mongoose.model('TherapySession', therapySessionSchema),
  HealthReport: mongoose.model('HealthReport', healthReportSchema),
  TechnicianTicket: mongoose.model('TechnicianTicket', technicianTicketSchema),
  Resource: mongoose.model('Resource', resourceSchema)
};
