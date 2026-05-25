# COROnet Backend API

A modern Express.js backend for the COROnet medical imaging platform. Features JWT authentication, MongoDB integration, and DICOM file management.

## Features

✅ **Authentication System**
- User registration and login with JWT tokens
- Secure password hashing with bcryptjs
- Token expiration and refresh
- Protected routes with middleware

✅ **DICOM Management**
- Upload DICOM medical imaging files
- Store file metadata in MongoDB
- Download/retrieve DICOM files
- Duplicate detection
- File cleanup on deletion

✅ **Database**
- MongoDB Atlas (cloud) or local MongoDB
- Mongoose ODM for data modeling
- Automatic timestamps on documents
- Data validation and indexing

✅ **API Features**
- RESTful API design
- CORS support for frontend integration
- Comprehensive error handling
- Health check endpoints
- Statistics endpoint

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcryptjs
- **File Upload:** Multer
- **Environment:** dotenv

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB

### Installation

1. **Clone and navigate to backend**
```bash
cd Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure MongoDB**
See `MONGODB_SETUP.md` for detailed setup instructions:
- MongoDB Atlas (cloud)
- Local MongoDB installation

5. **Update .env with your MongoDB URI**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=coronet
JWT_SECRET=your-secret-key-12345
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### Running the Server

**Development** (with auto-reload):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║           🏥 COROnet Backend Server Started              ║
╠═══════════════════════════════════════════════════════════╣
║  🌐 API URL: http://localhost:4000                        ║
║  ✅ Ready to accept requests                              ║
╚═══════════════════════════════════════════════════════════╝
```

## API Endpoints

### Health Check
```
GET /api/health
GET /api/health/stats
```

### Authentication
```
POST   /api/auth/register    - Create new user
POST   /api/auth/login       - Login user
GET    /api/auth/me          - Get current user (protected)
```

### DICOM Scans
```
GET    /api/scan             - List scans (protected)
GET    /api/scan/:id         - Get scan metadata (protected)
GET    /api/scan/:id/file    - Download DICOM file (protected)
POST   /api/scan/upload      - Upload DICOM file (protected)
DELETE /api/scan/:id         - Delete scan (protected)
```

### Items
```
GET    /api/items            - List items
POST   /api/items            - Create item
PUT    /api/items/:id        - Update item
DELETE /api/items/:id        - Delete item
```

## Example Requests

### Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Upload DICOM File
```bash
curl -X POST http://localhost:4000/api/scan/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/scan.dcm" \
  -F "patientName=John Doe" \
  -F "studyDate=2024-05-25" \
  -F "modality=CT"
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | Database name | `coronet` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `PORT` | Server port | `4000` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173` |
| `UPLOAD_DIR` | Upload directory | `uploads/dicom` |
| `MAX_FILE_SIZE` | Max file size in bytes | `524288000` (500 MB) |

## Project Structure

```
Backend/
├── config/
│   └── db.js                 # MongoDB connection setup
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   ├── User.js              # User schema
│   ├── Scan.js              # DICOM scan schema
│   └── Item.js              # Item schema
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── scan.js              # DICOM management endpoints
│   └── items.js             # Items CRUD endpoints
├── uploads/
│   └── dicom/               # DICOM file storage
├── server.js                # Express app entry point
├── package.json             # Dependencies
├── .env.example             # Environment template
├── .env                     # Environment variables (not in Git)
├── MONGODB_SETUP.md         # MongoDB setup guide
└── README.md                # This file
```

## Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Scan
```javascript
{
  userId: ObjectId (ref: User),
  originalName: String,
  path: String,
  size: Number,
  mimeType: String,
  doctorName: String,
  patientName: String,
  studyDate: String,
  modality: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Item
```javascript
{
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API returns standardized JSON responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security

- ✅ Passwords hashed with bcryptjs (10 salt rounds)
- ✅ JWT tokens for stateless authentication
- ✅ CORS protection enabled
- ✅ File upload validation (DICOM only)
- ✅ Path traversal protection
- ✅ SQL injection prevention (using Mongoose)
- ✅ Input validation and sanitization

## Troubleshooting

**MongoDB Connection Error**
- Check MONGODB_URI in .env is correct
- Verify MongoDB Atlas Network Access whitelist
- Ensure MongoDB service is running (local)

**Authentication Error**
- Verify JWT_SECRET matches between register and login
- Check Authorization header format: `Bearer <token>`
- Ensure token hasn't expired

**File Upload Error**
- Check file is valid DICOM (.dcm or .dicom)
- Verify file size doesn't exceed 500 MB
- Ensure uploads/dicom directory exists

See `MONGODB_SETUP.md` for more troubleshooting.

## License

MIT
