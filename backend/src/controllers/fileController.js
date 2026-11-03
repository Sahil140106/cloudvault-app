import multer from 'multer';
import { FileModel } from '../models/fileModel.js';
import { isAwsConfigured, S3_BUCKET_NAME, DYNAMO_FILES_TABLE } from '../config/aws.js';

// Multer memory storage configuration
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30 MB limit
  }
});

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a file to upload.' });
    }

    const savedFile = await FileModel.uploadFile({
      userId: req.user.id,
      file: req.file
    });

    res.status(201).json({
      message: 'File uploaded successfully!',
      file: savedFile,
      storageDestination: savedFile.storageType === 'aws_s3' ? 'AWS S3 Bucket' : 'Local Storage'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed.' });
  }
};

export const getUserFiles = async (req, res) => {
  try {
    const files = await FileModel.getFilesByUser(req.user.id);
    res.json({
      files,
      count: files.length,
      storageInfo: {
        isAwsConfigured,
        s3Bucket: S3_BUCKET_NAME,
        dynamoTable: DYNAMO_FILES_TABLE
      }
    });
  } catch (error) {
    console.error('Fetch files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files.' });
  }
};

export const deleteUserFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required.' });
    }

    const result = await FileModel.deleteFile(req.user.id, fileId);
    if (!result.success) {
      return res.status(404).json({ error: result.message || 'File not found.' });
    }

    res.json({ message: 'File deleted successfully from AWS/Storage.' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file.' });
  }
};

