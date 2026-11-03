# ☁️ AWS Full-Stack Deployment & Service Guide

Ye guide step-by-step batati hai ki is project me AWS services (DynamoDB, S3, IAM, App Runner / Amplify) kaise setup aur connect karni hain.

---

## 🏛️ Architecture Overview

```
                      +-----------------------------+
                      |   User's Web Browser        |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
    +----------------------+                   +----------------------+
    | Frontend (React)     |                   | S3 Direct Access     |
    | Hosted on AWS Amplify|                   | Presigned URLs for   |
    | or S3 + CloudFront   |                   | Docs & Image View    |
    +----------+-----------+                   +----------+-----------+
               |                                           ^
               | API Calls (Auth, Files, Metadata)         |
               v                                           |
    +------------------------------------------------------+--+
    | Backend API (Node.js Express)                           |
    | Hosted on AWS App Runner / Elastic Beanstalk / EC2      |
    +--------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|     AWS DynamoDB      |             |        AWS S3         |
|  - CloudVault_Users   |             |  - User Images        |
|  - CloudVault_Files   |             |  - User Documents     |
+-----------------------+             +-----------------------+
```

---

## 🔑 STEP 1: AWS IAM User aur Access Keys Create Karna

1. AWS Console (`https://console.aws.amazon.com/`) me login karein.
2. Search bar me **IAM** search karke open karein.
3. Left menu me **Users** par click karein aur **Create user** select karein.
4. User name de: `cloudvault-admin`.
5. Permissions option me **Attach policies directly** select karein:
   - `AmazonS3FullAccess`
   - `AmazonDynamoDBFullAccess`
6. User create hone ke baad us user par click karein, aur **Security credentials** tab me jayein.
7. **Create access key** &rarr; **Application running outside AWS** select karein.
8. Aapko **Access Key ID** aur **Secret Access Key** mil jayegi.

---

## ⚙️ STEP 2: `.env` File Configure Karna

Aapke project ke `backend/.env` file me in values ko paste karein:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_cloudvault_2026_change_me
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY

# AWS S3 Storage
AWS_S3_BUCKET_NAME=my-cloudvault-storage-bucket-unique-123

# AWS DynamoDB Tables
AWS_DYNAMODB_USERS_TABLE=CloudVault_Users
AWS_DYNAMODB_FILES_TABLE=CloudVault_Files
```

> **Note**: S3 Bucket name globally unique hona chahiye (e.g. `cloudvault-storage-sahil-2026`).

---

## ⚡ STEP 3: Automated AWS Resource Setup

Humne ek script ready ki hai jo S3 bucket, CORS aur DynamoDB tables automatically create kar degi:

```bash
cd backend
npm run setup-aws
```

Ye script automatically:
1. S3 Bucket create karegi
2. CORS policy configure karegi (jisse browser images/documents download kar sake)
3. DynamoDB tables (`CloudVault_Users`, `CloudVault_Files`) On-Demand Billing mode (Free tier friendly) me create karegi!

---

## 🚀 STEP 4: Backend ko AWS par Host Karna (AWS App Runner)

**AWS App Runner** Node.js backend host karne ka sabse asaan aur modern tareeka hai (Zero server maintenance):

1. Apne backend code ko GitHub par push karein.
2. AWS Console me **AWS App Runner** search karein.
3. **Create Service** &rarr; **Source code repository** (GitHub connect karein).
4. Repository aur branch (`main`) select karein.
5. Build settings:
   - **Runtime**: Node.js 18 or 20
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Port**: `5000`
6. Environment variables me wahi `.env` wale AWS keys aur secrets add karein.
7. **Deploy** par click karein! Aapko live backend URL mil jayega (e.g. `https://xxxxxx.ap-south-1.awsapprunner.com`).

---

## 🌐 STEP 5: Frontend ko AWS par Host Karna (AWS Amplify)

1. AWS Console me **AWS Amplify** search karein.
2. **Deploy an app** &rarr; **GitHub** select karein.
3. Apna repository select karein aur monorepo directory me `frontend` set karein.
4. Amplify automatically build command detect karega (`npm run build`).
5. **Save and Deploy** click karein!
6. Amplify aapko live HTTPS domain de dega (e.g. `https://main.xxxxxx.amplifyapp.com`).

---

## 🛡️ S3 Bucket CORS Policy (Manual Reference)

Agar aap manually S3 bucket banate hain to bucket ke **Permissions &rarr; Cross-origin resource sharing (CORS)** me ye JSON save karein:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

