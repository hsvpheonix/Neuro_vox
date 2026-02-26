const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'caregiver', 'technician', 'admin'],
    default: 'patient'
  },
  phone: { type: String },
  profileImage: { type: String },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Patient-specific
  dateOfBirth: { type: Date },
  bloodGroup: { type: String },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: [{ type: String }],
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedCaregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: { type: String }, // headband device ID

  // Doctor-specific
  specialization: { type: String },
  licenseNumber: { type: String },
  hospital: { type: String },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
