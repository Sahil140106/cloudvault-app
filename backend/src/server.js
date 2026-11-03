import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import { isAwsConfigured, AWS_REGION, S3_BUCKET_NAME, DYNAMO_USERS_TABLE } from './config/aws.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder (used when in local fallback mode)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/status', statusRoutes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'AWS CloudVault Full-Stack API',
    version: '1.0.0',
    awsConnected: isAwsConfigured,
    region: AWS_REGION,
    documentation: '/api/status/aws-status'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 AWS Fullstack Backend running on port ${PORT}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`☁️  AWS Integration: ${isAwsConfigured ? '🟢 ENABLED (Live AWS)' : '🟡 LOCAL FALLBACK MODE'}`);
  if (isAwsConfigured) {
    console.log(`   - Region: ${AWS_REGION}`);
    console.log(`   - S3 Bucket: ${S3_BUCKET_NAME}`);
    console.log(`   - DynamoDB Users: ${DYNAMO_USERS_TABLE}`);
  } else {
    console.log(`   💡 Tip: Add your AWS credentials in backend/.env to connect S3 & DynamoDB.`);
  }
  console.log(`=================================================`);
});

