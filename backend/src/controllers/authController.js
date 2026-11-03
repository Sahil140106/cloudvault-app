import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../models/userModel.js';
import { FileModel } from '../models/fileModel.js';
import { isAwsConfigured, S3_BUCKET_NAME, DYNAMO_USERS_TABLE, AWS_REGION } from '../config/aws.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cloudvault_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      createdAt: new Date().toISOString()
    };

    const savedUser = await UserModel.create(newUser);
    const token = generateToken(savedUser);

    const { password: _, ...userResponse } = savedUser;

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: userResponse,
      storageBackend: isAwsConfigured ? 'AWS DynamoDB' : 'Local Fallback Storage'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...userResponse } = user;

    res.json({
      message: 'Logged in successfully!',
      token,
      user: userResponse,
      storageBackend: isAwsConfigured ? 'AWS DynamoDB' : 'Local Fallback Storage'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userFiles = await FileModel.getFilesByUser(req.user.id);
    const totalBytes = userFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);

    const { password: _, ...userResponse } = user;

    res.json({
      user: userResponse,
      stats: {
        totalFiles: userFiles.length,
        totalBytes,
        imageCount: userFiles.filter(f => f.fileCategory === 'image').length,
        docCount: userFiles.filter(f => f.fileCategory === 'document').length
      },
      awsStatus: {
        isAwsConfigured,
        region: AWS_REGION,
        s3Bucket: S3_BUCKET_NAME,
        dynamoTable: DYNAMO_USERS_TABLE
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
};

