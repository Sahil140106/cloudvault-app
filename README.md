# ☁️ CloudVault - Full-Stack AWS Website (Auth, Database & S3 Storage)

A complete, production-ready Full-Stack Web Application built with:
- **Frontend**: React 18, Vite, Lucide Icons, Modern responsive UI
- **Backend**: Node.js, Express, JWT Authentication, Multer file handling
- **AWS Services**:
  - **AWS S3**: Secure upload, storage & presigned URLs for images and documents (PDF, Word, etc.)
  - **AWS DynamoDB**: Scalable cloud database for user profiles, credentials & file metadata
  - **AWS IAM**: Secure credential management
  - **AWS Hosting**: Ready for AWS App Runner / EC2 (Backend) & AWS Amplify / S3 (Frontend)

---

## ✨ Features

1. 🔐 **Authentication & Registration**:
   - User Sign Up with validation and password encryption (`bcryptjs`).
   - Secure Login with signed JSON Web Tokens (`JWT`).
   - User profile auto-fetch from AWS DynamoDB.
2. 📁 **Image & Document Upload**:
   - Drag & Drop interface with live previews.
   - Supports PNG, JPG, WebP, SVG, PDF, DOCX, XLSX, TXT, ZIP.
   - Stores files in AWS S3 and records metadata in DynamoDB.
   - Generates temporary secure AWS S3 Presigned URLs for viewing and downloading.
   - File deletion (removes object from AWS S3 and database record from DynamoDB).
3. 🔄 **Dual Engine (AWS Live + Local Sandbox Fallback)**:
   - Works immediately out-of-the-box in local sandbox mode.
   - When AWS keys are added to `backend/.env`, it seamlessly switches to live AWS S3 & DynamoDB.
4. 🛠️ **Automated AWS Resource Setup**:
   - Single command `npm run setup:aws` creates your S3 bucket, sets up CORS, and initializes DynamoDB tables automatically.

---

## 🚀 Quick Start Guide

### 1. Run the Backend API:
```bash
cd backend
npm run dev
```
Backend will start on: `http://localhost:5000`

### 2. Run the Frontend:
```bash
cd frontend
npm run dev
```
Frontend will start on: `http://localhost:5173`

---

## ☁️ How to Connect Your Real AWS Account

Detailed step-by-step Hindi + English guide is available in:
👉 [`aws-setup/AWS_GUIDE.md`](aws-setup/AWS_GUIDE.md)

### Quick Summary:
1. Open `backend/.env`
2. Enter your AWS IAM keys:
   ```env
   AWS_REGION=ap-south-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=wJalr...
   AWS_S3_BUCKET_NAME=my-unique-bucket-name
   ```
3. Run:
   ```bash
   npm run setup:aws
   ```
4. Done! All signups, user data, and uploaded images/documents will directly persist in your AWS account.

