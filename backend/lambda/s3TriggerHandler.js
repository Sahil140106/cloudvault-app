import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'ap-south-1';
const ddbClient = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const FILES_TABLE = process.env.AWS_DYNAMODB_FILES_TABLE || 'CloudVault_Files';

/**
 * Triggered automatically by AWS S3 whenever a new image or document is uploaded
 */
export const handler = async (event) => {
  console.log('S3 Trigger Event Received:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const fileKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const fileSize = record.s3.object.size;

    // Extract userId from path "users/<userId>/<timestamp>-<name>"
    const parts = fileKey.split('/');
    const userId = parts.length >= 2 ? parts[1] : 'unknown';
    const originalName = parts[parts.length - 1] || fileKey;

    const fileRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      originalName,
      fileKey,
      fileSize,
      s3Bucket: bucketName,
      storageType: 'aws_s3',
      fileCategory: fileKey.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? 'image' : 'document',
      createdAt: new Date().toISOString()
    };

    console.log(`Writing file record to DynamoDB table "${FILES_TABLE}":`, fileRecord);

    await ddb.send(new PutCommand({
      TableName: FILES_TABLE,
      Item: fileRecord
    }));
  }

  return { status: 'Successfully processed S3 upload event' };
};

