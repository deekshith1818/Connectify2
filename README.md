# Connectify - Video Calling Application

A real-time video calling application built with React, Node.js, Socket.IO, and WebRTC.

## Features

- Real-time video and audio calling
- Screen sharing
- Chat functionality during calls
- User authentication (register/login)
- Meeting history tracking
- Responsive design with Material-UI

## Tech Stack

### Backend
- Node.js with Express
- Socket.IO for real-time communication
- MongoDB with Mongoose
- bcrypt for password hashing
- CORS enabled

### Frontend
- React 19 with Vite
- Socket.IO client
- Material-UI components
- React Router for navigation
- Axios for API calls

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-here
```

5. Start the development server:
```bash
npm run dev
```

The backend will be running on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Update the `.env` file with your API URLs:
```env
VITE_API_URL=https://your-backend-domain.com
VITE_DEV_API_URL=http://localhost:8000
```

5. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:5173`

## Usage

1. Open the application in your browser
2. Register a new account or login with existing credentials
3. Enter a meeting code to join or create a new meeting
4. Allow camera and microphone permissions
5. Start video calling!

## API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user

### Meeting History (Protected)
- `GET /api/v1/users/get_all_activity` - Get user's meeting history
- `POST /api/v1/users/add_to_activity` - Add meeting to history

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 8000)
- `MONGODB_URI` - MongoDB connection string
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `JWT_SECRET` - Secret key for JWT tokens

### Frontend (.env)
- `VITE_API_URL` - Production API URL
- `VITE_DEV_API_URL` - Development API URL

## Production Deployment

### Backend
```bash
npm run prod
```

### Frontend
```bash
npm run build
```

## Security Features

- Password hashing with bcrypt
- CORS protection
- Authentication middleware for protected routes
- Secure WebRTC connections with STUN servers

## Troubleshooting

1. **CORS Errors**: Ensure your frontend domain is included in `ALLOWED_ORIGINS`
2. **Socket Connection Issues**: Check that the backend URL is correct in the frontend environment
3. **Media Permissions**: Ensure camera and microphone permissions are granted
4. **Database Connection**: Verify your MongoDB connection string is correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
