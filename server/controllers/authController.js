import User from '../models/User.js';
import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production_12345';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy_client_id');

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, subject } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role,
      subject: role === 'staff' ? (subject || '').trim() : '',
    });

    await user.save();

    // Generate token
    const token = jwt.encode(
      { userId: user._id, role: user.role },
      JWT_SECRET
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Find user
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.encode(
      { userId: user._id, role: user.role },
      JWT_SECRET
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return res.status(400).json({ error: 'Token and role are required' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Domain restriction check removed for all gmail users

    // Find if user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (user.role !== role) {
         return res.status(403).json({ error: `You are registered as a ${user.role}, please use the correct portal.` });
      }

      // Generate token
      const jwtToken = jwt.encode(
        { userId: user._id, role: user.role },
        JWT_SECRET
      );

      return res.json({
        success: true,
        message: 'Google login successful',
        token: jwtToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          subject: user.subject,
          avatar: user.avatar,
        },
      });
    } else {
      // User does not exist, require registration
      return res.status(200).json({
        requiresRegistration: true,
        email,
        name,
        picture: picture || 'https://via.placeholder.com/150',
        googleToken: token,
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google login failed' });
  }
};

export const googleRegister = async (req, res) => {
  try {
    const { googleToken, role, subject, phone, bio } = req.body;

    if (!googleToken || !role) {
      return res.status(400).json({ error: 'Missing required registration details via Google SSO.' });
    }

    // Verify Google ID token again for security
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists. Please log in.' });
    }

    const randomPassword = crypto.randomBytes(16).toString('hex');
    user = new User({
      name,
      email,
      password: randomPassword,
      role,
      avatar: picture || 'https://via.placeholder.com/150',
      subject: role === 'staff' ? (subject || '').trim() : '',
      phone: phone || '',
      bio: bio || '',
    });
    
    await user.save();

    const jwtToken = jwt.encode(
      { userId: user._id, role: user.role },
      JWT_SECRET
    );

    res.status(201).json({
      success: true,
      message: 'Google registration successful',
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google register error:', error);
    res.status(500).json({ error: 'Google registration failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, subject } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, phone, bio, subject: subject ? subject.trim() : '' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password');
    res.json({ success: true, staff });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch all users' });
  }
};
