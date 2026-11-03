import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN; // optional for temporary credentials

export const isAwsConfigured = Boolean(
  accessKeyId &&
  secretAccessKey &&
  !accessKeyId.includes('YOUR_') &&
  !secretAccessKey.includes('YOUR_')
);

// S3 Client configuration
let s3ClientInstance = null;
let ddbDocClientInstance = null;

if (isAwsConfigured) {
  const credentials = {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {})
  };

  s3ClientInstance = new S3Client({
    region,
    credentials
  });

  const dynamoClient = new DynamoDBClient({
    region,
    credentials
  });

  ddbDocClientInstance = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: true
    }
  });
}

export const s3 = s3ClientInstance;
export const ddbDocClient = ddbDocClientInstance;
export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'my-cloudvault-bucket';
export const DYNAMO_USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'CloudVault_Users';
export const DYNAMO_FILES_TABLE = process.env.AWS_DYNAMODB_FILES_TABLE || 'CloudVault_Files';
export const AWS_REGION = region;

