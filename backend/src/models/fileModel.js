import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { 
  PutCommand, 
  QueryCommand, 
  ScanCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';
import { 
  s3, 
  ddbDocClient, 
  S3_BUCKET_NAME, 
  DYNAMO_FILES_TABLE, 
  isAwsConfigured,
  AWS_REGION
} from '../config/aws.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_FILES_DB = path.join(LOCAL_DATA_DIR, 'files.json');
const LOCAL_UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure local directories exist
if (!fs.existsSync(LOCAL_DATA_DIR)) fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(LOCAL_FILES_DB)) fs.writeFileSync(LOCAL_FILES_DB, JSON.stringify([]), 'utf-8');

const getLocalFiles = () => {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILES_DB, 'utf-8'));
  } catch {
    return [];
  }
};

const saveLocalFiles = (files) => {
  fs.writeFileSync(LOCAL_FILES_DB, JSON.stringify(files, null, 2), 'utf-8');
};

export const FileModel = {
  async uploadFile({ userId, file }) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `users/${userId}/${timestamp}-${safeName}`;
    const fileCategory = file.mimetype.startsWith('image/') 
      ? 'image' 
      : (file.mimetype.includes('pdf') || file.mimetype.includes('word') || file.mimetype.includes('text') || file.mimetype.includes('sheet') || file.mimetype.includes('presentation'))
        ? 'document'
        : 'other';

    let storageType = 'local';
    let fileUrl = '';

    // Attempt AWS S3 Upload
    if (isAwsConfigured && s3) {
      try {
        const uploadCommand = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            userId: userId,
            originalName: safeName
          }
        });
        await s3.send(uploadCommand);
        storageType = 'aws_s3';
        fileUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;
      } catch (err) {
        console.warn(`[S3 Upload Warning] S3 upload failed, falling back to local: ${err.message}`);
        storageType = 'local';
      }
    }

    // If local fallback is needed
    if (storageType === 'local') {
      const localFilename = `${timestamp}-${safeName}`;
      const localFilePath = path.join(LOCAL_UPLOADS_DIR, localFilename);
      fs.writeFileSync(localFilePath, file.buffer);
      fileUrl = `/uploads/${localFilename}`;
    }

    const fileRecord = {
      id: `${timestamp}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      originalName: file.originalname,
      fileKey,
      fileType: file.mimetype,
      fileCategory,
      fileSize: file.size,
      storageType,
      s3Bucket: storageType === 'aws_s3' ? S3_BUCKET_NAME : null,
      fileUrl,
      createdAt: new Date().toISOString()
    };

    // Save metadata to DynamoDB
    if (isAwsConfigured && ddbDocClient) {
      try {
        const dynamoCommand = new PutCommand({
          TableName: DYNAMO_FILES_TABLE,
          Item: fileRecord
        });
        await ddbDocClient.send(dynamoCommand);
        return fileRecord;
      } catch (err) {
        console.warn(`[DynamoDB Warning] Saving file metadata to local: ${err.message}`);
      }
    }

    // Local file metadata fallback
    const allFiles = getLocalFiles();
    allFiles.push(fileRecord);
    saveLocalFiles(allFiles);

    return fileRecord;
  },

  async getFilesByUser(userId) {
    let files = [];

    if (isAwsConfigured && ddbDocClient) {
      try {
        const command = new ScanCommand({
          TableName: DYNAMO_FILES_TABLE,
          FilterExpression: 'userId = :uid',
          ExpressionAttributeValues: {
            ':uid': userId
          }
        });
        const result = await ddbDocClient.send(command);
        files = result.Items || [];
      } catch (err) {
        console.warn(`[DynamoDB Warning] Scan files fallback to local: ${err.message}`);
        files = getLocalFiles().filter(f => f.userId === userId);
      }
    } else {
      files = getLocalFiles().filter(f => f.userId === userId);
    }

    // For any AWS S3 file, refresh with a secure Presigned URL valid for 1 hour
    const enrichedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.storageType === 'aws_s3' && isAwsConfigured && s3) {
          try {
            const getCmd = new GetObjectCommand({
              Bucket: file.s3Bucket || S3_BUCKET_NAME,
              Key: file.fileKey
            });
            const presignedUrl = await getSignedUrl(s3, getCmd, { expiresIn: 3600 });
            return { ...file, presignedUrl, downloadUrl: presignedUrl };
          } catch (e) {
            return file;
          }
        }
        return { ...file, downloadUrl: file.fileUrl };
      })
    );

    // Sort newest first
    return enrichedFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async deleteFile(userId, fileId) {
    let fileRecord = null;

    if (isAwsConfigured && ddbDocClient) {
      try {
        // Find file
        const scanCmd = new ScanCommand({
          TableName: DYNAMO_FILES_TABLE,
          FilterExpression: 'id = :fid AND userId = :uid',
          ExpressionAttributeValues: { ':fid': fileId, ':uid': userId }
        });
        const res = await ddbDocClient.send(scanCmd);
        fileRecord = res.Items?.[0];

        if (fileRecord) {
          // Delete from DynamoDB
          await ddbDocClient.send(new DeleteCommand({
            TableName: DYNAMO_FILES_TABLE,
            Key: { id: fileId }
          }));
        }
      } catch (err) {
        console.warn(`[DynamoDB Warning] delete fallback to local: ${err.message}`);
      }
    }

    if (!fileRecord) {
      const files = getLocalFiles();
      const idx = files.findIndex(f => f.id === fileId && f.userId === userId);
      if (idx !== -1) {
        fileRecord = files[idx];
        files.splice(idx, 1);
        saveLocalFiles(files);
      }
    }

    if (!fileRecord) {
      return { success: false, message: 'File not found or unauthorized' };
    }

    // Delete from S3 if stored there
    if (fileRecord.storageType === 'aws_s3' && isAwsConfigured && s3) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: fileRecord.s3Bucket || S3_BUCKET_NAME,
          Key: fileRecord.fileKey
        }));
      } catch (err) {
        console.warn(`[S3 Delete Error] ${err.message}`);
      }
    } else if (fileRecord.storageType === 'local') {
      const filename = path.basename(fileRecord.fileUrl);
      const filePath = path.join(LOCAL_UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return { success: true };
  }
};

