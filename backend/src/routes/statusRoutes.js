import { Router } from 'express';
import { isAwsConfigured, S3_BUCKET_NAME, DYNAMO_USERS_TABLE, DYNAMO_FILES_TABLE, AWS_REGION } from '../config/aws.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/aws-status', (req, res) => {
  res.json({
    isAwsConfigured,
    region: AWS_REGION,
    services: {
      s3: {
        configured: isAwsConfigured,
        bucketName: S3_BUCKET_NAME,
        purpose: 'Storing uploaded user images and documents'
      },
      dynamoDB: {
        configured: isAwsConfigured,
        usersTable: DYNAMO_USERS_TABLE,
        filesTable: DYNAMO_FILES_TABLE,
        purpose: 'Storing registered users and file metadata'
      }
    },
    message: isAwsConfigured
      ? 'AWS Credentials detected. Interacting with AWS S3 & DynamoDB.'
      : 'Running in Local Sandbox mode. Configure AWS credentials in backend/.env to connect to real AWS services.'
  });
});

export default router;

