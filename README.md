# 📚 Student Doubt Resolution System

A complete full-stack application for resolving student academic doubts through real-time chat, slot booking, and material sharing.

## 🎯 Features

- **Authentication**: JWT-based secure authentication with role-based access (Student/Staff)
- **Slot Booking**: Students can book available time slots with staff
- **Real-time Chat**: Socket.io powered real-time messaging between students and staff
- **Study Materials**: Staff can upload and students can download study materials
- **Dashboard**: Role-specific dashboards for both students and staff
- **Material Management**: Organize materials by subject and topic
- **Professional UI**: Bootstrap 5 responsive design

## 📁 Project Structure

```
Student Doubt Resolution/
├── server/                          # Backend (Node.js + Express)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── slotController.js
│   │   ├── chatController.js
│   │   └── materialController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Slot.js
│   │   ├── Chat.js
│   │   └── Material.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── slotRoutes.js
│   │   ├── chatRoutes.js
│   │   └── materialRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── socket.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── student-client/                  # Student Portal (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── PrivateRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── StudentLogin.js
│   │   │   ├── StudentRegister.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── SlotBookingPage.js
│   │   │   ├── ChatPage.js
│   │   │   └── MaterialsPage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
│
└── staff-client/                    # Staff Portal (React)
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── PrivateRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── StaffLogin.js
    │   │   ├── StaffRegister.js
    │   │   ├── StaffDashboard.js
    │   │   ├── SlotManagementPage.js
    │   │   ├── ChatPage.js
    │   │   └── MaterialsUploadPage.js
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Socket.io** - Real-time communication
- **CORS** - Cross-origin requests

### Frontend
- **React** - UI library
- **React Router DOM** - Navigation
- **Axios** - HTTP client
- **Bootstrap 5** - Styling
- **Socket.io Client** - Real-time messaging
- **Context API** - State management

## ⚙️ Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (Local or Atlas) - [Download](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### Step 1: Setup MongoDB

If using MongoDB locally:
```bash
# Make sure MongoDB is running
mongod
```

Or create a MongoDB Atlas cluster and get your connection string.

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (already provided with defaults)
# Edit .env if needed:
# MONGODB_URI=mongodb://localhost:27017/student-doubt-resolution
# JWT_SECRET=your_jwt_secret_key_change_in_production_12345
# PORT=5000

# Start the backend server
npm start
# Or for development with auto-reload:
npm install -g nodemon
nodemon server.js
```

Backend will run on: **http://localhost:5000**

### Step 3: Student Portal Setup

Open a new terminal:

```bash
# Navigate to student-client directory
cd student-client

# Install dependencies
npm install

# Start the student portal
npm start
```

Student Portal will open at: **http://localhost:3000**

### Step 4: Staff Portal Setup

Open another new terminal:

```bash
# Navigate to staff-client directory
cd staff-client

# Install dependencies
npm install

# Start the staff portal (it will ask for a different port)
npm start
```

Staff Portal will open at: **http://localhost:3001**

## 📱 Usage Guide

### For Students

1. **Register**: Go to student portal → Click "Register here" → Fill details
2. **Login**: Enter credentials with role as "Student"
3. **Dashboard**: View quick actions and available features
4. **Book Slots**: Browse available staff slots and book one
5. **Chat**: Select a staff member and chat in real-time
6. **Materials**: View and download study materials by subject

### For Staff

1. **Register**: Go to staff portal → Click "Register here" → Fill details including subject specialty
2. **Login**: Enter credentials with role as "Staff"
3. **Dashboard**: View profile and quick actions
4. **Manage Slots**: Create time slots for students to book
5. **Chat**: View list of students and chat with them
6. **Materials**: Upload study materials for students

## 🔐 Authentication

- **Login**: Email + Password authentication
- **Token Storage**: JWT stored in localStorage
- **Auto-logout**: Clear localStorage on logout
- **Protected Routes**: All authenticated pages require valid token

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/staff` - Get all staff members

### Slots
- `POST /api/slots/create` - Create slot (Staff)
- `GET /api/slots/staff` - Get staff's slots
- `GET /api/slots/available` - Get available slots (Student)
- `GET /api/slots/my-slots` - Get student's booked slots
- `POST /api/slots/book` - Book a slot
- `POST /api/slots/:slotId/cancel` - Cancel booking
- `PUT /api/slots/:slotId` - Update slot
- `DELETE /api/slots/:slotId` - Delete slot

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/history/:userId` - Get chat history
- `GET /api/chat/list` - Get chat users list

### Materials
- `POST /api/materials/upload` - Upload material (Staff)
- `GET /api/materials` - Get all materials
- `GET /api/materials/staff` - Get staff's materials
- `PUT /api/materials/:materialId` - Update material
- `DELETE /api/materials/:materialId` - Delete material

## 🔄 Real-time Chat Flow

1. User connects to Socket.io server
2. Emits `user_join` with userId
3. Sends message with `send_message` event
4. Backend saves to MongoDB
5. Receiver gets `receive_message` event
6. Sender gets `message_sent` confirmation

## 📦 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "student" | "staff",
  subject: String,
  phone: String,
  bio: String,
  avatar: String,
  timestamps
}
```

### Slot
```javascript
{
  staffId: ObjectId,
  studentId: ObjectId,
  date: String,
  time: String,
  duration: Number,
  status: "Available" | "Booked",
  topic: String,
  notes: String,
  timestamps
}
```

### Chat
```javascript
{
  senderId: ObjectId,
  receiverId: ObjectId,
  message: String,
  timestamp: Date,
  read: Boolean,
  timestamps
}
```

### Material
```javascript
{
  staffId: ObjectId,
  title: String,
  description: String,
  subject: String,
  topic: String,
  fileUrl: String,
  fileType: String,
  uploadedAt: Date,
  timestamps
}
```

## 🎨 UI Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Bootstrap 5**: Professional styling without custom CSS
- **Loading States**: Spinners during API calls
- **Error Handling**: Toast alerts for user feedback
- **Empty States**: Helpful messages when no data
- **Card Layout**: Clean, organized content presentation

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: Cannot connect to MongoDB
Solution: 
1. Ensure MongoDB is running (mongod)
2. Check MONGODB_URI in .env file
3. Verify MongoDB is accessible
```

### Port Already in Use
```
Error: Port 3000/3001/5000 already in use
Solution:
1. Kill process: lsof -i :3000 (then kill PID)
2. Or use different port: PORT=3002 npm start
```

### Socket.io Connection Failed
```
Error: WebSocket connection failed
Solution:
1. Ensure backend is running on port 5000
2. Check CORS configuration in server.js
3. Verify firewall isn't blocking WebSocket
```

### Authentication Issues
```
Error: Invalid token or unauthorized
Solution:
1. Clear localStorage in browser console
2. Re-login to get fresh token
3. Ensure .env has correct JWT_SECRET
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configured for allowed origins
- **Protected Routes**: Middleware validation
- **Input Validation**: Server-side validation

## 📝 Environment Variables

Create `.env` in server directory:

```
MONGODB_URI=mongodb://localhost:27017/student-doubt-resolution
JWT_SECRET=your_jwt_secret_key_change_in_production_12345
PORT=5000
```

## 🚀 Deployment

### Backend (Heroku)
1. Install Heroku CLI
2. `heroku create app-name`
3. `heroku config:set MONGODB_URI=your_atlas_uri`
4. `git push heroku main`

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy built folder to Vercel or Netlify
3. Set environment variables for API URL

## 📞 Support & Contact

For issues or questions, create an issue in the repository.

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Learning! 📚✨**
