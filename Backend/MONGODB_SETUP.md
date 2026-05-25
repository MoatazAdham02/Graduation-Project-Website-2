================================================================================
                    CORONET - MONGODB SETUP GUIDE
================================================================================

OVERVIEW
--------
This guide explains how to set up MongoDB for the COROnet backend application.
You have two options:
  1. MongoDB Atlas (Cloud - RECOMMENDED for production)
  2. Local MongoDB Installation (For development)

We RECOMMEND using MongoDB Atlas because:
  ✅ No installation required
  ✅ Automatic backups
  ✅ Easy to scale
  ✅ Free tier available (512 MB storage)
  ✅ Works from anywhere


================================================================================
OPTION 1: MONGODB ATLAS (CLOUD - RECOMMENDED)
================================================================================

STEP 1: Create MongoDB Atlas Account
------------------------------------
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Click "Register with Email" or sign up with Google
3. Fill in your details:
   - Email: your@email.com
   - Create a password (min 8 characters)
   - First Name: Your Name
   - Last Name: Your Name
   - Company: (optional)
4. Accept terms and click "Get Started Free"
5. Check your email and verify your address
6. You'll be redirected to create your first cluster


STEP 2: Create a Cluster
------------------------
1. You should see "Create Your First Cluster" screen
2. Select the FREE tier (M0 cluster)
3. Choose your Cloud Provider:
   - AWS is usually best (most available regions)
4. Choose a region closest to you:
   - US: N. Virginia (us-east-1)
   - EU: Ireland (eu-west-1)
   - Asia: Singapore (ap-southeast-1)
5. Click "Create Cluster"
6. Wait 2-3 minutes for the cluster to deploy
   (You'll see a spinning loading indicator)


STEP 3: Create a Database User
-------------------------------
After the cluster is created:

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Fill in credentials:
   - Username: coronet_user (or your choice)
   - Password: Create a STRONG password
     Example: MySecurePass123!@#
     (Save this password - you'll need it!)
   - Authentication Method: Password
4. For Database User Privileges:
   - Select "Atlas admin"
5. Click "Add User"
6. Wait for confirmation (should see a checkmark)


STEP 4: Configure Network Access (IP Whitelist)
-----------------------------------------------
1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Choose one option:
   Option A (DEVELOPMENT - Less Secure):
   - Click "Allow access from anywhere"
   - Confirm "0.0.0.0/0"
   - This allows any IP to connect
   
   Option B (PRODUCTION - More Secure):
   - Enter your computer's IP address
   - Or: Click "Add Current IP Address"
4. Click "Confirm"
5. Wait for the change to apply (1-2 minutes)


STEP 5: Get Your Connection String
-----------------------------------
1. Go to "Databases" section (left sidebar)
2. Click "Connect" button on your cluster
3. Select "Connect Your Application"
4. Choose:
   - Driver: Node.js
   - Version: 5.5 or later
5. Copy the connection string
   It looks like:
   mongodb+srv://coronet_user:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   
   ⚠️  IMPORTANT: Replace PASSWORD with the password you created in STEP 3


STEP 6: Create Database Name (Optional)
----------------------------------------
The database name is automatically created when you first write data to it.
By default, we use: "coronet"

You can verify later by:
1. Going to "Databases" > "Collections"
2. Seeing your "coronet" database listed


STEP 7: Update Your .env File
------------------------------
In Backend/.env, add your connection details:

MONGODB_URI=mongodb+srv://coronet_user:your_password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=coronet
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
CORS_ORIGIN=http://localhost:5173


STEP 8: Test the Connection
----------------------------
From the Backend directory:
1. npm install
2. npm run dev

You should see:
✅ MongoDB Connected Successfully
📊 Database: coronet
🌐 Host: cluster0.xxxxx.mongodb.net


================================================================================
OPTION 2: LOCAL MONGODB INSTALLATION
================================================================================

STEP 1: Download and Install MongoDB
------------------------------------
Windows:
1. Go to: https://www.mongodb.com/try/download/community
2. Choose:
   - OS: Windows
   - Version: Latest
3. Click "Download"
4. Run the installer (.msi file)
5. Follow the setup wizard:
   - Accept license
   - Choose "Complete" installation
   - Keep defaults
   - Install MongoDB as a Service (checked)
   - Run MongoDB Compass (checked)
6. Click "Install"
7. Finish and MongoDB will start automatically

macOS:
1. Using Homebrew (recommended):
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community

Linux (Ubuntu):
1. sudo apt-get update
2. sudo apt-get install mongodb
3. sudo systemctl start mongodb


STEP 2: Verify Installation
---------------------------
Windows:
1. Open Command Prompt
2. Type: mongosh
3. You should see:> prompt

macOS/Linux:
1. Open Terminal
2. Type: mongosh
3. You should see: > prompt


STEP 3: Create a User (Optional but Recommended)
-----------------------------------------------
In mongosh shell:

1. Use admin database:
   > use admin

2. Create admin user:
   > db.createUser({
     user: "coronet_user",
     pwd: "your_password_here",
     roles: ["root"]
   })

3. Exit:
   > exit


STEP 4: Update Your .env File
------------------------------
In Backend/.env:

For local MongoDB without authentication:
MONGODB_URI=mongodb://localhost:27017/coronet
MONGODB_DB_NAME=coronet

OR with authentication:
MONGODB_URI=mongodb://coronet_user:your_password@localhost:27017/coronet
MONGODB_DB_NAME=coronet

Also add:
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
CORS_ORIGIN=http://localhost:5173


STEP 5: Test the Connection
----------------------------
From the Backend directory:
1. npm install
2. npm run dev

You should see:
✅ MongoDB Connected Successfully
📊 Database: coronet
🌐 Host: localhost


================================================================================
.ENV FILE REFERENCE
================================================================================

Create a file called `.env` in the Backend/ directory with these values:

MONGODB_URI=YOUR_CONNECTION_STRING_HERE
MONGODB_DB_NAME=coronet
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads/dicom
MAX_FILE_SIZE=524288000

Example for MongoDB Atlas:
MONGODB_URI=mongodb+srv://coronet_user:MyPassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=coronet
JWT_SECRET=my-super-secret-jwt-key-12345
PORT=4000
CORS_ORIGIN=http://localhost:5173

Example for Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/coronet
MONGODB_DB_NAME=coronet
JWT_SECRET=my-super-secret-jwt-key-12345
PORT=4000
CORS_ORIGIN=http://localhost:5173


================================================================================
TROUBLESHOOTING
================================================================================

PROBLEM 1: "MongoDB connection failed"
SOLUTION:
  - Check that MONGODB_URI in .env is correct
  - Verify the connection string has no spaces
  - Make sure your password doesn't have special characters (or escape them)
  - For MongoDB Atlas: Check Network Access IP whitelist
  - For Local: Make sure MongoDB service is running

PROBLEM 2: "Cannot connect to Atlas cluster"
SOLUTION:
  - Wait 2-3 minutes after creating cluster (it needs time to deploy)
  - Check "Network Access" - your IP must be whitelisted
  - Go to Databases > Connect and verify the connection string
  - Try ping command: mongosh "YOUR_CONNECTION_STRING"

PROBLEM 3: "Auth failed"
SOLUTION:
  - Verify username and password in MONGODB_URI match what you created
  - Password must match EXACTLY (case-sensitive)
  - If password has special characters, they must be URL-encoded:
    @ becomes %40
    # becomes %23
    $ becomes %24
    % becomes %25
    & becomes %26
    : becomes %3A
    / becomes %2F

PROBLEM 4: Database doesn't appear in Atlas
SOLUTION:
  - Databases are created automatically when you write data
  - Start the backend server and upload a DICOM file
  - Then refresh MongoDB Atlas and you'll see the database

PROBLEM 5: "Database name is uppercase but should be lowercase"
SOLUTION:
  - In MongoDB Atlas, database names are ALWAYS lowercase
  - If you set MONGODB_DB_NAME=COROnet
  - It will be stored as "coronet" (automatic)
  - This is normal, not an error


================================================================================
DATABASE COLLECTIONS REFERENCE
================================================================================

After setup and running the app, MongoDB will create these collections:

1. users
   Fields:
   - _id: ObjectId (auto)
   - name: String
   - email: String (unique)
   - password: String (hashed)
   - createdAt: Date (auto)
   - updatedAt: Date (auto)

2. scans
   Fields:
   - _id: ObjectId (auto)
   - userId: ObjectId (references users)
   - originalName: String (filename)
   - path: String (file path)
   - size: Number (bytes)
   - mimeType: String
   - doctorName: String
   - patientName: String
   - studyDate: String
   - modality: String
   - createdAt: Date (auto)
   - updatedAt: Date (auto)

3. items
   Fields:
   - _id: ObjectId (auto)
   - name: String
   - description: String
   - createdAt: Date (auto)
   - updatedAt: Date (auto)


================================================================================
CONNECTING TO YOUR DATABASE
================================================================================

MongoDB Atlas (Cloud):
-----------------------
1. Go to: https://cloud.mongodb.com
2. Log in with your credentials
3. Click your cluster
4. Click "Collections" to see your data
5. You can browse, edit, and delete documents

Local MongoDB (Compass GUI):
---------------------------
1. MongoDB Compass opens automatically on Windows
2. Or download from: https://www.mongodb.com/products/compass
3. Connection string: mongodb://localhost:27017
4. Click "Connect"
5. Browse your databases and collections

Command Line (Both):
--------------------
1. Open terminal/command prompt
2. Run mongosh with your connection string:
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/coronet"
3. Run queries:
   > show databases
   > use coronet
   > db.users.find()
   > db.scans.find()


================================================================================
SECURITY BEST PRACTICES
================================================================================

1. NEVER commit .env file to Git
   - Add to .gitignore (already done)

2. Change JWT_SECRET in production
   - Use a strong, random value
   - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

3. Use strong passwords for MongoDB
   - Min 12 characters
   - Mix uppercase, lowercase, numbers, symbols

4. In production on MongoDB Atlas:
   - Use IP whitelist (not 0.0.0.0/0)
   - Use VPC/Network peering
   - Enable encryption at rest and in transit
   - Enable IP access list

5. Rotate credentials regularly
   - Every 90 days is recommended

6. Monitor access
   - Enable audit logging in MongoDB Atlas
   - Review connection logs regularly


================================================================================
HELPFUL LINKS
================================================================================

MongoDB Atlas:
  - Main Site: https://www.mongodb.com/cloud/atlas
  - Documentation: https://docs.atlas.mongodb.com/
  - Connection Guide: https://docs.atlas.mongodb.com/driver-connection/

Local MongoDB:
  - Download: https://www.mongodb.com/try/download/community
  - Documentation: https://docs.mongodb.com/manual/

MongoDB Compass:
  - Download: https://www.mongodb.com/products/compass

Mongosh (CLI):
  - Documentation: https://www.mongodb.com/docs/mongodb-shell/

Node.js Driver:
  - Documentation: https://www.mongodb.com/docs/drivers/node/


================================================================================
SUPPORT
================================================================================

If you have issues:
1. Check the troubleshooting section above
2. Review the server logs when running: npm run dev
3. Verify .env file has no typos
4. Make sure MongoDB service is running
5. Check firewall/antivirus isn't blocking MongoDB port (27017)

For MongoDB Atlas support:
  - Go to: https://support.mongodb.com/
  - Or check Atlas UI for status/errors

Common Commands:
  - Test connection: mongosh "your_connection_string"
  - View databases: db.adminCommand({ listDatabases: true })
  - Count users: db.users.countDocuments()
  - Count scans: db.scans.countDocuments()


================================================================================
NEXT STEPS
================================================================================

After MongoDB is set up:

1. Install backend dependencies:
   cd Backend
   npm install

2. Create .env file with your MongoDB URI

3. Start the backend:
   npm run dev

4. You should see:
   ✅ MongoDB Connected Successfully
   🌐 API URL: http://localhost:4000

5. Test the API:
   - Open: http://localhost:4000/api/health
   - Should return JSON with database status

6. Start the frontend (in root folder):
   npm run dev

7. Go to: http://localhost:5173
   - Sign up and try the application!


================================================================================
                          END OF SETUP GUIDE
================================================================================
