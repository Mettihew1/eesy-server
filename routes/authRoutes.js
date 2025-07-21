import express from 'express';
import User from '../models/UserModel.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = express.Router();
 
// routes/auth.js
router.get('/check', (req, res) => {
  const token = req.cookies.token; // Get token from HTTP-only cookie
  
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to sanitize user data
const sanitizeUser = (user) => ({
  _id: user._id,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt
});

// Register endpoint
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  console.log(email, password, username, await User.find());
  

  try {
    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() }, 
        { username: username.trim() }
      ] 
    });
    
    if (userExists) {
      return res.status(409).json({ 
        message: userExists.email === email.toLowerCase().trim() 
          ? 'Email already in use' 
          : 'Username already taken'
      });
    }

    // Create and save user
    const user = new User({ 
      email: email.toLowerCase().trim(),
      password,
      username: username.trim(),
      role: 'user'
    });

    await user.save();

    console.log(await User.find());
    

    res.status(201).json({
      user: sanitizeUser(user),
      message: 'Registration successful'
    });


  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user with password
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign({ 
      id: user._id,
      role: user.role 
    }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1h' 
    });

    res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from 'strict'
  maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES) || 3600000,
  domain: process.env.COOKIE_DOMAIN || 'localhost', // Add this
  path: '/', // Ensure this is set
}).json({ 
      message: 'Login successful', 
      user: sanitizeUser(user)
    });

  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
});

// Password reset endpoints
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process request', error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update password and clear reset token
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed', error: err.message });
  }
});

// Auth validation endpoint
router.get('/validate-auth', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    res.json({ valid: true, user: { id: decoded.id, role: decoded.role } });
  });
});

export default router;