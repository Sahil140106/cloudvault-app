import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const region = process.env.AWS_REGION || 'ap-south-1';
const ddbClient = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(ddbClient);
const s3 = new S3Client({ region });

const USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'CloudVault_Users';
const FILES_TABLE = process.env.AWS_DYNAMODB_FILES_TABLE || 'CloudVault_Files';
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'my-cloudvault-bucket';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

export const handler = async (event) => {
  console.log('Incoming Event:', JSON.stringify(event));

  // Handle CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { path, httpMethod } = event;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    // 1. User Signup
    if (path.endsWith('/register') && httpMethod === 'POST') {
      const { name, email, password } = body;
      if (!name || !email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name, email, and password required' }) };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      const user = {
        id: userId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        createdAt: new Date().toISOString()
      };

      await ddb.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));
      const token = jwt.sign({ id: userId, email, name }, JWT_SECRET, { expiresIn: '7d' });

      const { password: _, ...safeUser } = user;
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'User registered in DynamoDB!', token, user: safeUser })
      };
    }

    // 2. User Login
    if (path.endsWith('/login') && httpMethod === 'POST') {
      const { email, password } = body;
      const scanRes = await ddb.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email.toLowerCase() }
      }));

      const user = scanRes.Items?.[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...safeUser } = user;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Login successful!', token, user: safeUser })
      };
    }

    // 3. Generate S3 Presigned Upload URL for Documents/Images
    if (path.endsWith('/get-upload-url') && httpMethod === 'POST') {
      const { fileName, fileType, userId } = body;
      const fileKey = `users/${userId}/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileKey,
        ContentType: fileType
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ uploadUrl, fileKey })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Route not found' }) };
  } catch (err) {
    console.error('Lambda error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

