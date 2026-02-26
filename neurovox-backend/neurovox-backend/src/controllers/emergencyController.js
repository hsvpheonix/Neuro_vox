const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');

// POST /api/emergency/sos - Trigger SOS alert
exports.triggerSOS = async (req, res, next) => {
  try {
    const { alertType = 'sos', message, location, severity = 'critical' } = req.body;

    const user = await User.findById(req.user.id)
      .populate('assignedDoctor', 'name email phone')
      .populate('assignedCaregiver', 'name email phone');

    const notifiedContacts = [];

    // Add emergency contact from profile
    if (user.emergencyContact?.phone) {
      notifiedContacts.push({
        name: user.emergencyContact.name,
        phone: user.emergencyContact.phone,
        notifiedAt: new Date(),
        method: 'sms'
      });
    }

    // Add doctor
    if (user.assignedDoctor) {
      notifiedContacts.push({
        name: user.assignedDoctor.name,
        email: user.assignedDoctor.email,
        phone: user.assignedDoctor.phone,
        notifiedAt: new Date(),
        method: 'app'
      });
    }

    // Add caregiver
    if (user.assignedCaregiver) {
      notifiedContacts.push({
        name: user.assignedCaregiver.name,
        email: user.assignedCaregiver.email,
        phone: user.assignedCaregiver.phone,
        notifiedAt: new Date(),
        method: 'app'
      });
    }

    const alert = await EmergencyAlert.create({
      userId: req.user.id,
      alertType,
      severity,
      message: message || `SOS Alert triggered by ${user.name}`,
      location,
      notifiedContacts
    });

    // In production: integrate with Twilio SMS, push notifications, etc.

    // Emit via Socket.io to all connected doctors/caregivers
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_alert', { alert, user: { name: user.name, id: user._id } });
    }

    res.status(201).json({
      success: true,
      message: `Emergency alert sent! ${notifiedContacts.length} contact(s) notified.`,
      alert
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/emergency/alerts - Get alerts (patient sees own, doctor sees assigned patients)
exports.getAlerts = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const query = {};

    if (req.user.role === 'patient') {
      query.userId = req.user.id;
    } else if (req.user.role === 'doctor') {
      const patients = await User.find({ assignedDoctor: req.user.id }, '_id');
      query.userId = { $in: patients.map(p => p._id) };
    } else if (req.user.role === 'caregiver') {
      const patients = await User.find({ assignedCaregiver: req.user.id }, '_id');
      query.userId = { $in: patients.map(p => p._id) };
    }

    if (status) query.status = status;

    const alerts = await EmergencyAlert.find(query)
      .populate('userId', 'name email phone emergencyContact')
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await EmergencyAlert.countDocuments(query);

    res.json({ success: true, alerts, total });
  } catch (error) {
    next(error);
  }
};

// PUT /api/emergency/alerts/:id/acknowledge
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'acknowledged', respondedBy: req.user.id },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });

    const io = req.app.get('io');
    if (io) io.emit('alert_acknowledged', { alertId: alert._id, respondedBy: req.user.name });

    res.json({ success: true, message: 'Alert acknowledged.', alert });
  } catch (error) {
    next(error);
  }
};

// PUT /api/emergency/alerts/:id/resolve
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', respondedBy: req.user.id, resolvedAt: new Date(), notes: req.body.notes },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, message: 'Alert resolved.', alert });
  } catch (error) {
    next(error);
  }
};

// GET /api/emergency/alerts/:id
exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id)
      .populate('userId', 'name email phone emergencyContact medicalHistory')
      .populate('respondedBy', 'name email');
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
};
