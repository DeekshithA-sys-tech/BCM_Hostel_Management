# Hostel Management System

A comprehensive enterprise-grade hostel management system built with modern web technologies. This system streamlines hostel operations including student management, room allocation, attendance tracking, food scheduling, complaint management, and administrative controls.

## 🎯 Features

### Core Management Modules
- **Student Management**: Register, update, and manage student profiles
- **Room Management**: Allocate rooms, track occupancy, and manage cots
- **Attendance Tracking**: Automated attendance system with history logs
- **Food Schedule Management**: Plan and manage meal schedules for residents
- **Complaint Management**: Submit, track, and resolve student complaints
- **Staff Management**: Manage staff roles and permissions
- **Admin Dashboard**: Comprehensive analytics and monitoring dashboard
- **Notifications**: Real-time notifications for important updates
- **Document Management**: Store and manage important documents

### Technical Features
- **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Security**: Helmet for HTTP headers, rate limiting, input validation
- **File Uploads**: Multer for document and image uploads
- **Scheduled Tasks**: Cron jobs for automated operations
- **Email Notifications**: Send alerts and notifications via email
- **Error Handling**: Comprehensive error handling and logging
- **Data Seeding**: Automated admin user creation on startup

## 🏗️ Project Structure

```
HOSTEL-MANAGEMENT/
├── backend/                          # Express.js API Server
│   ├── src/
│   │   ├── app.js                   # Express app setup
│   │   ├── server.js                # Server entry point
│   │   ├── config/                  # Configuration files
│   │   │   ├── db.js                # MongoDB connection
│   │   │   └── swagger.js           # Swagger documentation setup
│   │   ├── controllers/             # Route handlers
│   │   ├── middleware/              # Custom middleware
│   │   ├── models/                  # Mongoose schemas
│   │   ├── routes/                  # API routes
│   │   ├── services/                # Business logic
│   │   ├── validators/              # Input validation
│   │   └── utils/                   # Utility functions
│   ├── package.json
│   └── logs/                        # Application logs
│
├── frontend/                         # React + Vite Frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Admin/               # Admin dashboard pages
│   │   │   ├── Student/             # Student dashboard pages
│   │   │   ├── Auth/                # Login/registration pages
│   │   │   └── Landing/             # Landing page
│   │   ├── components/              # Reusable components
│   │   ├── services/                # API service layer
│   │   ├── store/                   # Zustand store
│   │   ├── context/                 # React context (if used)
│   │   ├── hooks/                   # Custom React hooks
│   │   └── assets/                  # Static assets
│   ├── package.json
│   └── vite.config.js
│
└── README.md                         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas connection string)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/hostel-management
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # Email Service (for notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=./uploads
   ```

5. **Start the server**
   ```bash
   # Development with auto-reload
   npm run dev
   
   # Production
   npm start
   ```

   The server will run on `http://localhost:5000`
   
   API Documentation: `http://localhost:5000/api/v1/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   # Create .env.local or .env
   ```

4. **Configure environment variables**
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## 📚 API Documentation

Once the backend is running, access the auto-generated Swagger documentation at:
```
http://localhost:5000/api/v1/docs
```

### Main API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token

#### Students
- `GET /api/v1/students` - List all students
- `POST /api/v1/students` - Create student
- `GET /api/v1/students/:id` - Get student details
- `PUT /api/v1/students/:id` - Update student
- `DELETE /api/v1/students/:id` - Delete student

#### Rooms
- `GET /api/v1/rooms` - List all rooms
- `POST /api/v1/rooms` - Create room
- `PUT /api/v1/rooms/:id` - Update room
- `GET /api/v1/rooms/:id/availability` - Check room availability

#### Attendance
- `GET /api/v1/attendance` - Get attendance records
- `POST /api/v1/attendance` - Mark attendance
- `GET /api/v1/attendance/:studentId` - Get student attendance

#### Food Schedule
- `GET /api/v1/food-schedule` - Get food schedules
- `POST /api/v1/food-schedule` - Create schedule
- `PUT /api/v1/food-schedule/:id` - Update schedule

#### Complaints
- `GET /api/v1/complaints` - List complaints
- `POST /api/v1/complaints` - Submit complaint
- `PUT /api/v1/complaints/:id` - Update complaint status

#### Admin
- `GET /api/v1/admin/dashboard` - Dashboard statistics
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/admin/broadcast` - Send notifications

## 🔐 Authentication & Authorization

The system uses JWT (JSON Web Tokens) for authentication with role-based access control (RBAC).

### User Roles
- **Admin**: Full system access, can manage all entities
- **Staff**: Can manage students, attendance, and food schedules
- **Student**: Can view own profile, submit complaints, view schedules

### Protected Routes
All API routes (except `/auth/*`) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Default Admin Credentials
On first run, the system automatically creates an admin user:
- **Email**: admin@hostel.local
- **Password**: Admin@123

⚠️ **Important**: Change the default credentials immediately in production!

## 🛠️ Available Scripts

### Backend
```bash
npm run dev         # Start with nodemon (auto-reload)
npm start           # Start production server
npm test            # Run tests
npm run test:coverage # Generate test coverage report
npm run lint        # Run ESLint
```

### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

## 📦 Dependencies

### Backend
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **joi**: Input validation
- **nodemailer**: Email service
- **multer**: File upload handling
- **node-cron**: Scheduled tasks
- **swagger-ui-express**: API documentation
- **helmet**: Security middleware
- **morgan**: HTTP logging
- **winston**: Application logging

### Frontend
- **react**: UI library
- **vite**: Build tool
- **react-router-dom**: Client-side routing
- **axios**: HTTP client
- **zustand**: State management
- **lucide-react**: Icon library

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

Tests are located in the `tests/` directory and use Jest with Supertest.

## 🌐 Deployment

### Backend Deployment (Render, Heroku, etc.)
1. Push code to GitHub
2. Connect repository to deployment platform
3. Set environment variables
4. Deploy

### Frontend Deployment (Vercel, Netlify, etc.)
1. Build the project: `npm run build`
2. Deploy the `dist/` directory
3. Configure environment variables for production API URL

## 📝 Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hostel

# Server Config
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app_password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

### Frontend (.env.local or .env)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Ensure PORT is not in use
- Check logs in `backend/logs/` directory

### Frontend API calls failing
- Verify backend is running
- Check `VITE_API_BASE_URL` configuration
- Check browser console for CORS errors
- Ensure JWT token is being sent in Authorization header

### Database connection issues
- Verify MongoDB is running locally or connection string for Atlas
- Check database name in connection string
- Ensure network access for MongoDB Atlas

## 📄 License

This project is proprietary software.

## 👥 Support

For support, please contact the development team or create an issue in the repository.

## 🚀 Future Enhancements

- [ ] Mobile app for students and staff
- [ ] Advanced analytics and reporting
- [ ] Parent portal for hostel updates
- [ ] Automated fee management
- [ ] Integration with university portal
- [ ] Mobile push notifications
- [ ] Advanced room allocation algorithms

---

**Last Updated**: May 26, 2026
