import { S3Client, CreateBucketCommand, PutBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { 
  DynamoDBClient, 
  CreateTableCommand, 
  DescribeTableCommand, 
  waitUntilTableExists 
} from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME || `cloudvault-storage-${Date.now().toString(36)}`;
const usersTable = process.env.AWS_DYNAMODB_USERS_TABLE || 'CloudVault_Users';
const filesTable = process.env.AWS_DYNAMODB_FILES_TABLE || 'CloudVault_Files';

console.log('----------------------------------------------------');
console.log('🚀 AWS CloudVault Automatic Resource Setup');
console.log('----------------------------------------------------');

if (!accessKeyId || !secretAccessKey || accessKeyId.includes('YOUR_')) {
  console.error('❌ Error: AWS credentials not found in backend/.env');
  console.log('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env first.');
  process.exit(1);
}

const credentials = { accessKeyId, secretAccessKey };
const s3Client = new S3Client({ region, credentials });
const dynamoClient = new DynamoDBClient({ region, credentials });

async function setupS3() {
  console.log(`\n📦 [1/2] Checking S3 Bucket: ${bucketName}...`);
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ S3 Bucket "${bucketName}" already exists.`);
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`Creating S3 Bucket "${bucketName}" in region "${region}"...`);
      try {
        const createParams = {
          Bucket: bucketName,
          ...(region !== 'us-east-1' ? {
            CreateBucketConfiguration: { LocationConstraint: region }
          } : {})
        };
        await s3Client.send(new CreateBucketCommand(createParams));
        console.log(`✅ S3 Bucket "${bucketName}" created successfully!`);
      } catch (createErr) {
        console.error(`❌ S3 Bucket creation failed: ${createErr.message}`);
        return;
      }
    } else {
      console.error(`❌ S3 HeadBucket failed: ${err.message}`);
      return;
    }
  }

  // Set S3 CORS
  try {
    console.log(`Configuring CORS for bucket "${bucketName}"...`);
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag']
          }
        ]
      }
    };
    await s3Client.send(new PutBucketCorsCommand(corsParams));
    console.log(`✅ S3 Bucket CORS rules applied successfully.`);
  } catch (corsErr) {
    console.warn(`⚠️ Warning: Could not set CORS: ${corsErr.message}`);
  }
}

async function createTableIfNotExists(tableName, keySchema, attributeDefinitions) {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`✅ DynamoDB Table "${tableName}" already exists.`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`Creating DynamoDB Table "${tableName}"...`);
      const params = {
        TableName: tableName,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST'
      };
      await dynamoClient.send(new CreateTableCommand(params));
      console.log(`⏳ Waiting for table "${tableName}" to become ACTIVE...`);
      await waitUntilTableExists({ client: dynamoClient, maxWaitTime: 60 }, { TableName: tableName });
      console.log(`✅ Table "${tableName}" is now active!`);
    } else {
      console.error(`❌ Table check failed for "${tableName}": ${err.message}`);
    }
  }
}

async function setupDynamoDB() {
  console.log(`\n🗄️  [2/2] Checking DynamoDB Tables...`);
  // Users table: Primary Key 'id' (String)
  await createTableIfNotExists(
    usersTable,
    [{ AttributeName: 'id', KeyType: 'HASH' }],
    [{ AttributeName: 'id', AttributeType: 'S' }]
  );

  // Files table: Primary Key 'id' (String)
  await createTableIfNotExists(
    filesTable,
    [{ AttributeName: 'id', KeyType: 'HASH' }],
    [{ AttributeName: 'id', AttributeType: 'S' }]
  );
}

async function run() {
  try {
    await setupS3();
    await setupDynamoDB();
    console.log('\n🎉 ==================================================');
    console.log('✅ AWS Resources are ready to use!');
    console.log(`S3 Bucket: ${bucketName}`);
    console.log(`DynamoDB Users: ${usersTable}`);
    console.log(`DynamoDB Files: ${filesTable}`);
    console.log(`Region: ${region}`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('Fatal setup error:', error);
  }
}

run();

