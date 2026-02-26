const { MindLog, Appointment, TherapySession, HealthReport, TechnicianTicket, Resource } = require('../models/index');
const User = require('../models/User');
const BrainSignal = require('../models/BrainSignal');
const EmergencyAlert = require('../models/EmergencyAlert');

// ═══════════════════════════════════════════════════════════════════════════
// MIND LOG
// ═══════════════════════════════════════════════════════════════════════════

exports.createMindLog = async (req, res, next) => {
  try {
    const { title, content, mood, tags, isPrivate } = req.body;

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'happy', 'wonderful', 'amazing', 'better', 'hopeful', 'joy'];
    const negativeWords = ['bad', 'pain', 'sad', 'terrible', 'awful', 'worse', 'fear', 'scared', 'depressed'];
    const words = content.toLowerCase().split(' ');
    const posScore = words.filter(w => positiveWords.includes(w)).length;
    const negScore = words.filter(w => negativeWords.includes(w)).length;
    const sentimentScore = (posScore - negScore) / Math.max(words.length, 1);
    const sentimentLabel = sentimentScore > 0.05 ? 'positive' : sentimentScore < -0.05 ? 'negative' : 'neutral';

    const log = await MindLog.create({
      userId: req.user.id,
      title, content, mood, tags, isPrivate,
      sentiment: { score: parseFloat(sentimentScore.toFixed(2)), label: sentimentLabel }
    });

    res.status(201).json({ success: true, message: 'Mind log entry created.', log });
  } catch (error) {
    next(error);
  }
};

exports.getMindLogs = async (req, res, next) => {
  try {
    const { limit = 20, page = 1, mood, from, to } = req.query;
    const query = { userId: req.user.id };
    if (mood) query.mood = mood;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const logs = await MindLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await MindLog.countDocuments(query);

    res.json({ success: true, logs, total });
  } catch (error) {
    next(error);
  }
};

exports.getMindLogById = async (req, res, next) => {
  try {
    const log = await MindLog.findOne({ _id: req.params.id, userId: req.user.id });
    if (!log) return res.status(404).json({ success: false, message: 'Log entry not found.' });
    res.json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

exports.updateMindLog = async (req, res, next) => {
  try {
    const log = await MindLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!log) return res.status(404).json({ success: false, message: 'Log entry not found.' });
    res.json({ success: true, message: 'Log updated.', log });
  } catch (error) {
    next(error);
  }
};

exports.deleteMindLog = async (req, res, next) => {
  try {
    const log = await MindLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!log) return res.status(404).json({ success: false, message: 'Log entry not found.' });
    res.json({ success: true, message: 'Log entry deleted.' });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════

exports.createAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.create({
      patientId: req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, message: 'Appointment booked successfully.', appointment });
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;
    const query = {};

    if (req.user.role === 'patient') query.patientId = req.user.id;
    else if (req.user.role === 'doctor') query.doctorId = req.user.id;

    if (status) query.status = status;
    if (upcoming === 'true') query.appointmentDate = { $gte: new Date() };

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email specialization hospital')
      .sort({ appointmentDate: 1 });

    res.json({ success: true, appointments, total: appointments.length });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate('patientId', 'name email').populate('doctorId', 'name email');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.json({ success: true, message: 'Appointment updated.', appointment });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id, { status: 'cancelled' }, { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    res.json({ success: true, message: 'Appointment cancelled.', appointment });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/hospitals - Search hospitals nearby
exports.searchHospitals = async (req, res, next) => {
  try {
    const { city, query } = req.query;
    // In production: integrate with Google Places API
    const mockHospitals = [
      { name: 'AIIMS Delhi', address: 'Ansari Nagar, New Delhi', phone: '+91-11-26588500', specialties: ['Neurology', 'Speech Therapy'] },
      { name: 'Fortis Hospital', address: 'Multiple locations across India', phone: '+91-1800-103-3747', specialties: ['Neurology', 'Rehabilitation'] },
      { name: 'Apollo Hospitals', address: 'Pan India', phone: '+91-1860-500-1066', specialties: ['Neuroscience', 'Speech Therapy'] },
    ];
    res.json({ success: true, hospitals: mockHospitals, message: 'Integrate Google Places API for real hospital data.' });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// THERAPY SESSIONS
// ═══════════════════════════════════════════════════════════════════════════

exports.createTherapySession = async (req, res, next) => {
  try {
    const session = await TherapySession.create({
      patientId: req.user.role === 'patient' ? req.user.id : req.body.patientId,
      therapistId: req.user.role !== 'patient' ? req.user.id : req.body.therapistId,
      ...req.body
    });
    res.status(201).json({ success: true, message: 'Therapy session scheduled.', session });
  } catch (error) {
    next(error);
  }
};

exports.getTherapySessions = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') query.patientId = req.user.id;
    else query.therapistId = req.user.id;

    const sessions = await TherapySession.find(query)
      .populate('patientId', 'name email')
      .populate('therapistId', 'name email specialization')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, sessions, total: sessions.length });
  } catch (error) {
    next(error);
  }
};

exports.updateTherapySession = async (req, res, next) => {
  try {
    const session = await TherapySession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    res.json({ success: true, message: 'Session updated.', session });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH REPORTS
// ═══════════════════════════════════════════════════════════════════════════

exports.generateHealthReport = async (req, res, next) => {
  try {
    const { patientId, from, to, reportType = 'weekly', doctorNotes } = req.body;
    const targetPatientId = patientId || req.user.id;

    const fromDate = new Date(from || Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = new Date(to || Date.now());

    // Aggregate brain signals
    const signals = await BrainSignal.find({
      userId: targetPatientId,
      timestamp: { $gte: fromDate, $lte: toDate }
    });

    // Aggregate emergency alerts
    const alerts = await EmergencyAlert.find({
      userId: targetPatientId,
      createdAt: { $gte: fromDate, $lte: toDate }
    });

    const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + (b || 0), 0) / arr.length) : 0;
    const emotionBreakdown = {};
    signals.forEach(s => {
      if (s.emotionalState) emotionBreakdown[s.emotionalState] = (emotionBreakdown[s.emotionalState] || 0) + 1;
    });
    const mostFrequentEmotion = Object.keys(emotionBreakdown).sort((a, b) => emotionBreakdown[b] - emotionBreakdown[a])[0] || 'neutral';

    const report = await HealthReport.create({
      patientId: targetPatientId,
      generatedBy: req.user.id,
      reportType,
      period: { from: fromDate, to: toDate },
      summary: `Health report for the period ${fromDate.toDateString()} to ${toDate.toDateString()}. ${signals.length} brain signal readings captured.`,
      brainActivity: {
        avgAlpha: avg(signals.map(s => s.rawSignal?.alpha)),
        avgBeta: avg(signals.map(s => s.rawSignal?.beta)),
        avgTheta: avg(signals.map(s => s.rawSignal?.theta)),
        avgDelta: avg(signals.map(s => s.rawSignal?.delta)),
        avgGamma: avg(signals.map(s => s.rawSignal?.gamma)),
      },
      emotionalSummary: { mostFrequentEmotion, emotionBreakdown },
      communicationStats: {
        totalTranslations: signals.filter(s => s.translatedText).length,
        avgConfidence: avg(signals.map(s => s.confidence)),
        wordsGenerated: signals.reduce((acc, s) => acc + (s.translatedText?.split(' ').length || 0), 0)
      },
      emergencyAlerts: {
        total: alerts.length,
        resolved: alerts.filter(a => a.status === 'resolved').length
      },
      doctorNotes,
      isSharedWithDoctor: !!patientId
    });

    res.status(201).json({ success: true, message: 'Health report generated.', report });
  } catch (error) {
    next(error);
  }
};

exports.getHealthReports = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') query.patientId = req.user.id;

    const reports = await HealthReport.find(query)
      .populate('patientId', 'name email')
      .populate('generatedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ success: true, reports, total: reports.length });
  } catch (error) {
    next(error);
  }
};

exports.getHealthReportById = async (req, res, next) => {
  try {
    const report = await HealthReport.findById(req.params.id)
      .populate('patientId', 'name email dateOfBirth bloodGroup')
      .populate('generatedBy', 'name role specialization');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICIAN SUPPORT
// ═══════════════════════════════════════════════════════════════════════════

exports.createTicket = async (req, res, next) => {
  try {
    const ticket = await TechnicianTicket.create({ userId: req.user.id, ...req.body });
    res.status(201).json({ success: true, message: 'Support ticket created. A technician will contact you shortly.', ticket });
  } catch (error) {
    next(error);
  }
};

exports.getTickets = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') query.userId = req.user.id;
    else if (req.user.role === 'technician') query.assignedTo = req.user.id;

    const tickets = await TechnicianTicket.find(query)
      .populate('userId', 'name email phone deviceId')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tickets, total: tickets.length });
  } catch (error) {
    next(error);
  }
};

exports.updateTicket = async (req, res, next) => {
  try {
    const ticket = await TechnicianTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    res.json({ success: true, message: 'Ticket updated.', ticket });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════════════════════

exports.createResource = async (req, res, next) => {
  try {
    const resource = await Resource.create({ createdBy: req.user.id, ...req.body });
    res.status(201).json({ success: true, message: 'Resource created.', resource });
  } catch (error) {
    next(error);
  }
};

exports.getResources = async (req, res, next) => {
  try {
    const { category, search, limit = 20, page = 1 } = req.query;
    const query = { isPublic: true };
    if (category) query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];

    const resources = await Resource.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    const total = await Resource.countDocuments(query);

    res.json({ success: true, resources, total });
  } catch (error) {
    next(error);
  }
};

exports.getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('createdBy', 'name role');
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found.' });
    res.json({ success: true, resource });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DOCTOR PORTAL
// ═══════════════════════════════════════════════════════════════════════════

exports.getDoctorPatients = async (req, res, next) => {
  try {
    const patients = await User.find({ assignedDoctor: req.user.id, role: 'patient' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, patients, total: patients.length });
  } catch (error) {
    next(error);
  }
};

exports.getPatientProfile = async (req, res, next) => {
  try {
    const patient = await User.findById(req.params.patientId).select('-password');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    // Get recent signals
    const recentSignals = await BrainSignal.find({ userId: req.params.patientId })
      .sort({ timestamp: -1 }).limit(10);

    // Get recent alerts
    const recentAlerts = await EmergencyAlert.find({ userId: req.params.patientId })
      .sort({ createdAt: -1 }).limit(5);

    res.json({ success: true, patient, recentSignals, recentAlerts });
  } catch (error) {
    next(error);
  }
};

exports.addAnnotation = async (req, res, next) => {
  try {
    const { patientId, signalId, note } = req.body;
    // In production: save to a DoctorAnnotation model
    res.json({ success: true, message: 'Annotation saved.', annotation: { patientId, signalId, note, doctorId: req.user.id, createdAt: new Date() } });
  } catch (error) {
    next(error);
  }
};

exports.assignDoctor = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;
    const patient = await User.findByIdAndUpdate(patientId, { assignedDoctor: doctorId }, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    // Add patient to doctor's list
    await User.findByIdAndUpdate(doctorId, { $addToSet: { patients: patientId } });

    res.json({ success: true, message: 'Doctor assigned to patient.', patient });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalSignals,
      recentSignals,
      activeAlerts,
      mindLogCount,
      upcomingAppointments,
      latestSignal
    ] = await Promise.all([
      BrainSignal.countDocuments({ userId }),
      BrainSignal.find({ userId, timestamp: { $gte: sevenDaysAgo } }),
      EmergencyAlert.countDocuments({ userId, status: 'active' }),
      MindLog.countDocuments({ userId }),
      Appointment.find({ patientId: userId, status: 'confirmed', appointmentDate: { $gte: new Date() } }).limit(3).populate('doctorId', 'name specialization'),
      BrainSignal.findOne({ userId }).sort({ timestamp: -1 })
    ]);

    const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + (b || 0), 0) / arr.length) : 0;

    res.json({
      success: true,
      dashboard: {
        totalSignalsRecorded: totalSignals,
        activeEmergencyAlerts: activeAlerts,
        mindLogEntries: mindLogCount,
        upcomingAppointments,
        weeklyStats: {
          totalReadings: recentSignals.length,
          avgConfidence: avg(recentSignals.map(s => s.confidence)),
          avgAttention: avg(recentSignals.map(s => s.attentionLevel)),
          avgFatigue: avg(recentSignals.map(s => s.fatigueLevel)),
        },
        currentState: latestSignal ? {
          emotionalState: latestSignal.emotionalState,
          cognitiveLoad: latestSignal.cognitiveLoad,
          lastReading: latestSignal.timestamp
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};
