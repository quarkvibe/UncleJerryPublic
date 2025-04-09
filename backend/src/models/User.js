const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [8, 'Password must be at least 8 characters']
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  companyName: { type: String },
  role: { 
    type: String, 
    enum: ['contractor', 'admin'], 
    default: 'contractor' 
  },
  primaryTrade: { 
    type: String, 
    enum: ['electrical', 'plumbing', 'carpentry', 'hvac', 'drywall', 'flooring', 'roofing', 'sheathing', 'acoustics', 'other'],
    default: 'other'
  },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String }
  },
  licenseNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

// Pre-save hook to hash passwords
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile (excludes sensitive information)
UserSchema.methods.getProfile = function() {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    companyName: this.companyName,
    role: this.role,
    primaryTrade: this.primaryTrade,
    phone: this.phone,
    address: this.address,
    licenseNumber: this.licenseNumber,
    createdAt: this.createdAt,
    status: this.status
  };
};

const User = mongoose.model('User', UserSchema);

module.exports = User;