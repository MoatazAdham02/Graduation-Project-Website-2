# MongoDB Setup Guide for Your Graduation Project

## 🎯 Overview

This guide will help you integrate MongoDB into your Medical DICOM Viewer project. You have two main options:

1. **MongoDB Atlas** (Recommended) - Cloud database, free tier, easiest setup
2. **Local MongoDB** - Install on your computer, more control

---

## ✅ Recommended: MongoDB Atlas (Cloud - Free Tier)

**Why Atlas is perfect for graduation projects:**
- ✅ Free tier (512MB storage, shared cluster)
- ✅ No installation needed
- ✅ Works from anywhere
- ✅ Easy to demo
- ✅ Professional setup
- ✅ Automatic backups

---

## 🚀 Step 1: Set Up MongoDB Atlas (15 minutes)

### 1.1 Create Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Sign up with email or Google account

### 1.2 Create a Cluster
1. After login, click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select a cloud provider (AWS recommended)
4. Choose a region close to you
5. Click "Create Cluster" (takes 3-5 minutes)

### 1.3 Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username (e.g., `medical-dicom-user`)
5. Generate secure password (save it!)
6. Set privileges: "Atlas admin" or "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - ⚠️ For production, use specific IPs
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

   mongodb+srv://medical-dicom-user:<ZXBqUvF2qtuewSpu>@cluster0.dagjxov.mongodb.net/?appName=Cluster0
   ```
5. Replace `<username>` and `<password>` with your credentials
medical-dicom-user     ZXBqUvF2qtuewSpu
---

## 📦 Step 2: Install MongoDB Driver

```bash
npm install mongoose
```

**Mongoose** is the most popular MongoDB library for Node.js - it makes working with MongoDB much easier!

---

## 🗂️ Step 3: Project Structure

Create this structure:

```
your-project/
├── backend/              ← New folder
│   ├── server.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Study.js
│   │   └── Report.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── studies.js
│   │   └── reports.js
│   ├── config/
│   │   └── database.js
│   └── .env
├── src/                  ← Your existing React app
└── package.json
```

---

## 📝 Step 4: Backend Setup

### 4.1 Install Backend Dependencies

```bash
cd backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install -D nodemon
```

### 4.2 Create `.env` file

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/medical-dicom?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000
```

### 4.3 Database Connection (`backend/config/database.js`)

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### 4.4 Server Setup (`backend/server.js`)

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/studies', require('./routes/studies'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 📊 Step 5: Create Database Models

### 5.1 User Model (`backend/models/User.js`)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['doctor', 'radiologist', 'admin'],
    default: 'doctor'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 5.2 Patient Model (`backend/models/Patient.js`)

```javascript
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    lowercase: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
```

### 5.3 Study Model (`backend/models/Study.js`)

```javascript
const mongoose = require('mongoose');

const studySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  studyId: {
    type: String,
    required: true,
    unique: true
  },
  modality: {
    type: String,
    enum: ['CT', 'MRI', 'X-Ray', 'Ultrasound', 'PET', 'Other'],
    required: true
  },
  studyDate: {
    type: Date,
    required: true
  },
  description: String,
  bodyPart: String,
  files: [{
    fileName: String,
    fileSize: Number,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dicomData: {
    width: Number,
    height: Number,
    pixelSpacing: String,
    sliceThickness: Number
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Study', studySchema);
```

### 5.4 Report Model (`backend/models/Report.js`)

```javascript
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Study',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  findings: [{
    title: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical'],
      default: 'normal'
    }
  }],
  recommendations: [String],
  physicianName: String,
  physicianTitle: String,
  reportDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);
```

---

## 🔐 Step 6: Authentication Routes

### 6.1 Auth Routes (`backend/routes/auth.js`)

```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
```

---

## 📋 Step 7: Patient Routes Example

### 7.1 Patient Routes (`backend/routes/patients.js`)

```javascript
const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get single patient
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('studies');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Patient ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;
```

---

## 🔗 Step 8: Update Frontend to Use API

### 8.1 Create API Service (`src/services/api.js`)

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (email, password) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  getCurrentUser: () => apiCall('/auth/me'),
};

// Patients API
export const patientsAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/patients${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiCall(`/patients/${id}`),
  
  create: (patientData) => apiCall('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  }),
  
  update: (id, patientData) => apiCall(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patientData),
  }),
  
  delete: (id) => apiCall(`/patients/${id}`, {
    method: 'DELETE',
  }),
};

// Studies API
export const studiesAPI = {
  getAll: () => apiCall('/studies'),
  getById: (id) => apiCall(`/studies/${id}`),
  create: (studyData) => apiCall('/studies', {
    method: 'POST',
    body: JSON.stringify(studyData),
  }),
};

// Reports API
export const reportsAPI = {
  getAll: () => apiCall('/reports'),
  getById: (id) => apiCall(`/reports/${id}`),
  create: (reportData) => apiCall('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  }),
};
```

### 8.2 Update AuthContext (`src/context/AuthContext.jsx`)

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      authAPI.getCurrentUser()
        .then(data => {
          setUser(data.user)
          setIsAuthenticated(true)
        })
        .catch(() => {
          localStorage.removeItem('authToken')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData)
      localStorage.setItem('authToken', data.token)
      setUser(data.user)
      setIsAuthenticated(true)
      return data
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password)
      localStorage.setItem('authToken', data.token)
      setUser(data.user)
      setIsAuthenticated(true)
      return data
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      login, 
      logout, 
      register,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## 🚀 Step 9: Run Your Application

### 9.1 Start Backend

```bash
cd backend
npm run dev
# Or add to package.json: "dev": "nodemon server.js"
```

### 9.2 Start Frontend

```bash
npm run dev
```

### 9.3 Test Connection

Visit: `http://localhost:5000/api/health`

Should return: `{ "status": "OK", "message": "Server is running" }`

---

## 📝 Step 10: Environment Variables

### Frontend `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/medical-dicom?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
```

---

## 🎓 For Your Graduation Project Report

**What to mention:**
- "Implemented MongoDB database using MongoDB Atlas cloud service"
- "Used Mongoose ODM for schema modeling and data validation"
- "RESTful API architecture with Express.js backend"
- "JWT-based authentication for secure user sessions"
- "MongoDB Atlas provides automatic backups and scalability"

---

## 🔄 Alternative: Local MongoDB

If you prefer local MongoDB:

### Install MongoDB:
- **Windows**: Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Mac**: `brew install mongodb-community`
- **Linux**: `sudo apt-get install mongodb`

### Connection String:
```env
MONGODB_URI=mongodb://localhost:27017/medical-dicom
```

---

## ✅ Quick Checklist

- [ ] Create MongoDB Atlas account
- [ ] Create cluster (free tier)
- [ ] Create database user
- [ ] Configure network access
- [ ] Get connection string
- [ ] Install Mongoose: `npm install mongoose`
- [ ] Create backend folder structure
- [ ] Set up database connection
- [ ] Create models (User, Patient, Study, Report)
- [ ] Create API routes
- [ ] Update frontend to use API
- [ ] Test connection
- [ ] Deploy backend (optional)

---

## 🎯 Next Steps

1. **Start with Authentication** - Get login/register working first
2. **Add Patients** - Migrate patient management to MongoDB
3. **Add Studies** - Store DICOM studies in database
4. **Add Reports** - Store reports in database
5. **File Storage** - Consider storing DICOM files (use GridFS or cloud storage)

---

## 💡 Pro Tips

1. **Use MongoDB Compass** - Visual database browser (free)
2. **Index Important Fields** - Add indexes to frequently queried fields
3. **Validate Data** - Use Mongoose schemas for validation
4. **Error Handling** - Always handle database errors gracefully
5. **Environment Variables** - Never commit `.env` files to Git

---

## 🐛 Troubleshooting

### Connection Failed?
- Check your connection string
- Verify username/password are correct
- Check network access (IP whitelist)
- Ensure cluster is running

### "Module not found"?
- Make sure you're in the backend folder
- Run `npm install` in backend folder

### Authentication errors?
- Check JWT_SECRET is set
- Verify token is being sent in headers

---

## 📚 Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University](https://university.mongodb.com/) - Free courses!

---

## ✅ You're Ready!

MongoDB is now set up! Start with authentication, then gradually migrate your other features.

Good luck with your project! 🎓🚀

