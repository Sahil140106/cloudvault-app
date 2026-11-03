import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  ScanCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { ddbDocClient, DYNAMO_USERS_TABLE, isAwsConfigured } from '../config/aws.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DATA_DIR = path.join(__dirname, '../../data');
const LOCAL_USERS_FILE = path.join(LOCAL_DATA_DIR, 'users.json');

// Ensure local fallback directory exists
if (!fs.existsSync(LOCAL_DATA_DIR)) {
  fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_USERS_FILE)) {
  fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify([]), 'utf-8');
}

const getLocalUsers = () => {
  try {
    const raw = fs.readFileSync(LOCAL_USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveLocalUsers = (users) => {
  fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

export const UserModel = {
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (isAwsConfigured && ddbDocClient) {
      try {
        // Query by GSI 'email-index' or scan with filter
        const command = new ScanCommand({
          TableName: DYNAMO_USERS_TABLE,
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': normalizedEmail
          }
        });
        const result = await ddbDocClient.send(command);
        return result.Items?.[0] || null;
      } catch (err) {
        console.warn(`[DynamoDB Warning] findByEmail fallback to local: ${err.message}`);
      }
    }

    const users = getLocalUsers();
    return users.find(u => u.email === normalizedEmail) || null;
  },

  async findById(id) {
    if (isAwsConfigured && ddbDocClient) {
      try {
        const command = new GetCommand({
          TableName: DYNAMO_USERS_TABLE,
          Key: { id }
        });
        const result = await ddbDocClient.send(command);
        return result.Item || null;
      } catch (err) {
        console.warn(`[DynamoDB Warning] findById fallback to local: ${err.message}`);
      }
    }

    const users = getLocalUsers();
    return users.find(u => u.id === id) || null;
  },

  async create(user) {
    const item = {
      ...user,
      email: user.email.toLowerCase().trim(),
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isAwsConfigured && ddbDocClient) {
      try {
        const command = new PutCommand({
          TableName: DYNAMO_USERS_TABLE,
          Item: item
        });
        await ddbDocClient.send(command);
        return item;
      } catch (err) {
        console.warn(`[DynamoDB Warning] create user fallback to local: ${err.message}`);
      }
    }

    const users = getLocalUsers();
    users.push(item);
    saveLocalUsers(users);
    return item;
  },

  async update(id, updates) {
    const updatedAt = new Date().toISOString();
    const itemUpdates = { ...updates, updatedAt };

    if (isAwsConfigured && ddbDocClient) {
      try {
        const updateKeys = Object.keys(itemUpdates);
        const updateExpression = 'SET ' + updateKeys.map(k => `#${k} = :${k}`).join(', ');
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        updateKeys.forEach(k => {
          expressionAttributeNames[`#${k}`] = k;
          expressionAttributeValues[`:${k}`] = itemUpdates[k];
        });

        const command = new UpdateCommand({
          TableName: DYNAMO_USERS_TABLE,
          Key: { id },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW'
        });

        const result = await ddbDocClient.send(command);
        return result.Attributes;
      } catch (err) {
        console.warn(`[DynamoDB Warning] update user fallback to local: ${err.message}`);
      }
    }

    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...itemUpdates };
      saveLocalUsers(users);
      return users[idx];
    }
    return null;
  }
};

