import { S3Client, ListObjectsV2Command, DeleteObjectCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'ap-south-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'my-cloudvault-storage-bucket';
const usersTable = process.env.AWS_DYNAMODB_USERS_TABLE || 'CloudVault_Users';
const filesTable = process.env.AWS_DYNAMODB_FILES_TABLE || 'CloudVault_Files';

const credentials = { accessKeyId, secretAccessKey };
const s3Client = new S3Client({ region, credentials });
const dynamoClient = new DynamoDBClient({ region, credentials });

async function revertS3() {
  console.log(`\n🗑️  Deleting S3 Bucket "${bucketName}"...`);
  try {
    // List and delete all objects if any
    const listRes = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
    if (listRes.Contents && listRes.Contents.length > 0) {
      for (const obj of listRes.Contents) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key }));
        console.log(`   Deleted object: ${obj.Key}`);
      }
    }
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`✅ S3 Bucket "${bucketName}" deleted successfully!`);
  } catch (err) {
    if (err.name === 'NoSuchBucket' || err.$metadata?.httpStatusCode === 404) {
      console.log(`ℹ️  S3 Bucket "${bucketName}" does not exist.`);
    } else {
      console.warn(`⚠️ S3 Delete Warning: ${err.message}`);
    }
  }
}

async function revertDynamoTable(tableName) {
  console.log(`\n🗑️  Deleting DynamoDB Table "${tableName}"...`);
  try {
    await dynamoClient.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`✅ DynamoDB Table "${tableName}" deleted successfully!`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`ℹ️  Table "${tableName}" does not exist.`);
    } else {
      console.warn(`⚠️ DynamoDB Delete Warning for "${tableName}": ${err.message}`);
    }
  }
}

async function main() {
  console.log('----------------------------------------------------');
  console.log('🔄 Reverting AWS Resources created by setup script');
  console.log('----------------------------------------------------');

  await revertS3();

  // If user also wants DynamoDB deleted, we can delete or keep
  // Let's delete DynamoDB tables if requested
  const deleteDynamo = process.argv.includes('--all');
  if (deleteDynamo) {
    await revertDynamoTable(usersTable);
    await revertDynamoTable(filesTable);
  } else {
    console.log('\n💡 Note: DynamoDB tables kept intact. Run with --all to also delete DynamoDB tables.');
  }

  console.log('\n====================================================');
  console.log('✅ Revert complete!');
  console.log('====================================================\n');
}

main();

