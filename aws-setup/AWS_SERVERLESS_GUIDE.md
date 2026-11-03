# ☁️ Complete AWS Serverless Guide: IAM + DynamoDB + S3 + Lambda

Is guide me hum dekhenge ki kaise 4 basic aur core AWS services milkar ek complete production-grade website banati hain:
1. **IAM (Security & Permissions)**
2. **DynamoDB (Database)**
3. **S3 (File Storage)**
4. **AWS Lambda (Serverless Backend Logic)**

---

## 🏛️ Flow Diagram: Ye Charo Services Kaam Kaise Karti Hain?

```
+-----------------------------------------------------------+
|                   User (React Frontend)                   |
+-----------------------------+-----------------------------+
                              |
       +----------------------+----------------------+
       | 1. Signup / Login                           | 3. Upload File
       v                                             v
+---------------+                             +---------------+
|  API Gateway  |                             |   AWS S3      |
+-------+-------+                             |   Bucket      |
        |                                     +-------+-------+
        v                                             | 4. S3 ObjectCreated
+---------------+                                     |    Event Trigger
|  AWS Lambda   |                                     v
|  (Auth / API) |                             +---------------+
+-------+-------+                             |  AWS Lambda   |
        |                                     | (File Trigger)|
        | 2. Save User                        +-------+-------+
        v                                             | 5. Save Metadata
+-----------------------------------------------------+-------+
|                       AWS DynamoDB                          |
|             (CloudVault_Users & CloudVault_Files)           |
+-------------------------------------------------------------+
```

---

## 1️⃣ STEP 1: IAM (Identity & Access Management) Setup

IAM ka kaam hota hai permissions control karna. Hume do cheezein chahiye:
1. **Ek IAM User** (Apne local laptop se AWS connect karne ke liye).
2. **Ek IAM Role** (AWS Lambda ko DynamoDB aur S3 access karne ki permission dene ke liye).

### A. IAM User Banayein (Local Computer ke liye):
1. AWS Console me search karein **IAM** &rarr; Left menu me **Users** &rarr; **Create user**.
2. User name daalein: `cloudvault-developer`.
3. **Set permissions** me **Attach policies directly** select karein aur ye policies tick karein:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AWSLambda_FullAccess`
4. User create hone ke baad us par click karein &rarr; **Security credentials** tab me jayein.
5. **Access keys** &rarr; **Create access key** &rarr; Select karein **Command Line Interface (CLI)** ya **Application running outside AWS**.
6. Aapko **Access Key ID** aur **Secret Access Key** mil jayegi. Isko safe copy kar lein!

### B. IAM Role Banayein (Lambda ke liye):
1. IAM Dashboard me **Roles** &rarr; **Create role**.
2. **Trusted entity type**: `AWS service` &rarr; Use case: `Lambda` select karein &rarr; Click **Next**.
3. Permissions me ye policies add karein:
   - `AWSLambdaBasicExecutionRole` (Logs CloudWatch me bhejne ke liye)
   - `AmazonDynamoDBFullAccess` (DynamoDB padhne aur likhne ke liye)
   - `AmazonS3FullAccess` (S3 files manage karne ke liye)
4. Role Name dein: `Lambda-DynamoDB-S3-ExecutionRole` &rarr; Click **Create role**.

---

## 2️⃣ STEP 2: DynamoDB (Database) Setup

DynamoDB AWS ka fast NoSQL database hai jisme server manage nahi karna padta. Hume 2 tables banani hain:

### A. Users Table:
1. AWS Console me search karein **DynamoDB** &rarr; **Create table**.
2. **Table name**: `CloudVault_Users`
3. **Partition key (Primary Key)**: `id` (Type: `String`).
4. **Table settings**: Select karein **Custom settings** &rarr; **Billing mode** me select karein **On-demand** (Isse billing sirf tab aayegi jab request aayegi, zero maintenance, free tier friendly).
5. Click **Create table**.

### B. Files Table:
1. Click **Create table**.
2. **Table name**: `CloudVault_Files`
3. **Partition key**: `id` (Type: `String`).
4. **Billing mode**: **On-demand**.
5. Click **Create table**.

---

## 3️⃣ STEP 3: S3 (Simple Storage Service) Setup

S3 me user ki uploaded images aur documents store honge.

1. AWS Console me search karein **S3** &rarr; **Create bucket**.
2. **Bucket name**: Koi unique naam dein (jaise: `cloudvault-storage-sahil-2026`).
3. **AWS Region**: Wahi region chunein jisme DynamoDB banaya hai (jaise: `ap-south-1` Mumbai).
4. **Block Public Access**: Default checked rehne dein (Recommended for security). Files secure **Presigned URLs** ke through access hongi.
5. Click **Create bucket**.

### CORS (Cross-Origin Resource Sharing) Configure Karein:
Apne bucket par click karein &rarr; **Permissions** tab &rarr; Scroll down to **Cross-origin resource sharing (CORS)** &rarr; **Edit** &rarr; Ye paste karein:

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
Click **Save changes**.

---

## 4️⃣ STEP 4: AWS Lambda Functions Setup

Lambda bina server ke aapka backend code run karta hai. Hume 2 main Lambda patterns use karne hote hain:

### Pattern 1: Auth & API Lambda (API Gateway ke saath)
Ye function user ke register/login aur profile fetch request ko handle karta hai aur DynamoDB me record insert/fetch karta hai.

### Pattern 2: S3 Event Trigger Lambda (File Upload hote hi automatically chalne wala)
Jaise hi user koi file S3 me daalega, S3 automatically is Lambda function ko call karega aur ye function metadata DynamoDB me likh dega!

1. AWS Console me **Lambda** &rarr; **Create function** &rarr; Name: `ProcessUploadedFile`.
2. **Runtime**: Node.js 20.x.
3. **Execution role**: Choose existing role &rarr; `Lambda-DynamoDB-S3-ExecutionRole`.
4. Function banne ke baad **Add trigger** par click karein &rarr; **S3** select karein &rarr; Apna bucket choose karein &rarr; Event type: `All object create events` &rarr; Click **Add**.

---

## 5️⃣ STEP 5: Local Project Me AWS Keys Connect Karna

Aapke project ke `backend/.env` file me jaakar apni Step 1 wali keys daal dein:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_DYNAMODB_USERS_TABLE=CloudVault_Users
AWS_DYNAMODB_FILES_TABLE=CloudVault_Files
```

Ab project me saari queries real **AWS DynamoDB** me jayengi aur saari files real **AWS S3** me upload hongi!

