require('dotenv').config();
const express = require('express');
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'SESSION_SECRET', 'FRONTEND_LOCAL_URL', 'FRONTEND_PROD_URL'];
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
      tls: process.env.NODE_ENV === 'production',
      tlsAllowInvalidCertificates: false,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};
connectDB();

// MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "session",
});

store.on('error', function(error) {
  console.error('Session store error:', error);
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Request logging
app.use(morgan('dev'));

// CORS config (CORS must be applied **before** session)
const corsOptions = {
  origin: [
    process.env.FRONTEND_LOCAL_URL,
    process.env.FRONTEND_PROD_URL,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// HTTPS redirection in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Session config
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store, // MongoDB/Redis store
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
};
app.use(session(sessionConfig));

// Body and cookie parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AJ Shoe Store API',
    documentation: 'https://docs.your-api.com',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Auth routes
app.use('/api/auth', require('./routes/authRoute'));

// Debug middleware (consider removing in production)
app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});