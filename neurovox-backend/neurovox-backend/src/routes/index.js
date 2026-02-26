// src/routes/index.js - All routes combined
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const brainController = require('../controllers/brainController');
const emergencyController = require('../controllers/emergencyController');
const mainController = require('../controllers/mainController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── AUTH ROUTES (/api/auth) ──────────────────────────────────────────────
const authRouter = express.Router();
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/me', protect, authController.getMe);
authRouter.put('/update-profile', protect, upload.single('profileImage'), authController.updateProfile);
authRouter.put('/change-password', protect, authController.changePassword);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password/:token', authController.resetPassword);
authRouter.delete('/delete-account', protect, authController.deleteAccount);

// ─── BRAIN SIGNAL ROUTES (/api/brain) ────────────────────────────────────
const brainRouter = express.Router();
brainRouter.use(protect);
brainRouter.post('/signal', brainController.ingestSignal);
brainRouter.get('/history', brainController.getSignalHistory);
brainRouter.get('/live', brainController.getLiveSignal);
brainRouter.get('/stats', brainController.getStats);
brainRouter.post('/translate', brainController.translateToSpeech);

// ─── EMERGENCY ROUTES (/api/emergency) ───────────────────────────────────
const emergencyRouter = express.Router();
emergencyRouter.use(protect);
emergencyRouter.post('/sos', emergencyController.triggerSOS);
emergencyRouter.get('/alerts', emergencyController.getAlerts);
emergencyRouter.get('/alerts/:id', emergencyController.getAlertById);
emergencyRouter.put('/alerts/:id/acknowledge', emergencyController.acknowledgeAlert);
emergencyRouter.put('/alerts/:id/resolve', emergencyController.resolveAlert);

// ─── MIND LOG ROUTES (/api/mindlog) ──────────────────────────────────────
const mindLogRouter = express.Router();
mindLogRouter.use(protect);
mindLogRouter.post('/', mainController.createMindLog);
mindLogRouter.get('/', mainController.getMindLogs);
mindLogRouter.get('/:id', mainController.getMindLogById);
mindLogRouter.put('/:id', mainController.updateMindLog);
mindLogRouter.delete('/:id', mainController.deleteMindLog);

// ─── APPOINTMENT ROUTES (/api/appointments) ───────────────────────────────
const appointmentRouter = express.Router();
appointmentRouter.use(protect);
appointmentRouter.get('/hospitals', mainController.searchHospitals);
appointmentRouter.post('/', mainController.createAppointment);
appointmentRouter.get('/', mainController.getAppointments);
appointmentRouter.put('/:id', mainController.updateAppointment);
appointmentRouter.put('/:id/cancel', mainController.cancelAppointment);

// ─── THERAPY ROUTES (/api/therapy) ───────────────────────────────────────
const therapyRouter = express.Router();
therapyRouter.use(protect);
therapyRouter.post('/', mainController.createTherapySession);
therapyRouter.get('/', mainController.getTherapySessions);
therapyRouter.put('/:id', mainController.updateTherapySession);

// ─── HEALTH REPORT ROUTES (/api/reports) ─────────────────────────────────
const reportRouter = express.Router();
reportRouter.use(protect);
reportRouter.post('/generate', mainController.generateHealthReport);
reportRouter.get('/', mainController.getHealthReports);
reportRouter.get('/:id', mainController.getHealthReportById);

// ─── TECHNICIAN ROUTES (/api/technician) ─────────────────────────────────
const technicianRouter = express.Router();
technicianRouter.use(protect);
technicianRouter.post('/ticket', mainController.createTicket);
technicianRouter.get('/tickets', mainController.getTickets);
technicianRouter.put('/tickets/:id', mainController.updateTicket);

// ─── RESOURCES ROUTES (/api/resources) ───────────────────────────────────
const resourceRouter = express.Router();
resourceRouter.get('/', mainController.getResources);
resourceRouter.get('/:id', mainController.getResourceById);
resourceRouter.post('/', protect, authorize('doctor', 'admin'), mainController.createResource);

// ─── DOCTOR PORTAL ROUTES (/api/doctor) ──────────────────────────────────
const doctorRouter = express.Router();
doctorRouter.use(protect, authorize('doctor', 'admin'));
doctorRouter.get('/patients', mainController.getDoctorPatients);
doctorRouter.get('/patients/:patientId', mainController.getPatientProfile);
doctorRouter.post('/annotate', mainController.addAnnotation);
doctorRouter.post('/assign', mainController.assignDoctor);

// ─── DASHBOARD ROUTES (/api/dashboard) ───────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.use(protect);
dashboardRouter.get('/', mainController.getDashboardStats);

// ─── USERS ROUTES (/api/users) ────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/doctors', async (req, res, next) => {
  try {
    const User = require('../models/User');
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name email specialization hospital licenseNumber');
    res.json({ success: true, doctors });
  } catch (e) { next(e); }
});
userRouter.get('/caregivers', async (req, res, next) => {
  try {
    const User = require('../models/User');
    const caregivers = await User.find({ role: 'caregiver', isActive: true })
      .select('name email phone');
    res.json({ success: true, caregivers });
  } catch (e) { next(e); }
});
// Admin only
userRouter.get('/all', authorize('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { role, page = 1, limit = 20 } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password')
      .limit(parseInt(limit)).skip((page - 1) * parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, users, total });
  } catch (e) { next(e); }
});
userRouter.put('/:id/deactivate', authorize('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.json({ success: true, message: 'User deactivated.', user });
  } catch (e) { next(e); }
});

// ─── CHATBOT ROUTE (/api/chatbot) ─────────────────────────────────────────
const chatbotRouter = express.Router();
chatbotRouter.post('/message', protect, async (req, res, next) => {
  try {
    const { message } = req.body;
    // In production: integrate with OpenAI, Anthropic Claude, or custom NLP model
    const botResponses = {
      'help': 'I can help you with navigation, understanding your brain signals, or connecting to your doctor.',
      'emergency': 'If this is an emergency, please press the SOS button immediately or call emergency services.',
      'signal': 'Your brain signals are being monitored. You can view details in the Live Dashboard.',
      'appointment': 'You can book appointments through the Hospital Locator & Appointment Booking section.',
      'default': 'I am NeuroVox AI assistant. How can I help you today? Try asking about your signals, appointments, or emergency features.'
    };
    const lower = message.toLowerCase();
    let response = botResponses.default;
    for (const key of Object.keys(botResponses)) {
      if (lower.includes(key)) { response = botResponses[key]; break; }
    }
    res.json({ success: true, response, timestamp: new Date() });
  } catch (error) {
    next(error);
  }
});

// ─── Mount all routers ────────────────────────────────────────────────────
router.use('/auth', authRouter);
router.use('/brain', brainRouter);
router.use('/emergency', emergencyRouter);
router.use('/mindlog', mindLogRouter);
router.use('/appointments', appointmentRouter);
router.use('/therapy', therapyRouter);
router.use('/reports', reportRouter);
router.use('/technician', technicianRouter);
router.use('/resources', resourceRouter);
router.use('/doctor', doctorRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', userRouter);
router.use('/chatbot', chatbotRouter);

// API health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'NeuroVox API is running 🧠', version: '1.0.0', timestamp: new Date() });
});

module.exports = router;
