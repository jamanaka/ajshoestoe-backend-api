require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { logErrors, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// 2. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// 3. Enable CORS with production-ready settings
const corsOptions = {
  origin: [
    process.env.FRONTEND_LOCAL_URL,
    process.env.FRONTEND_PROD_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// 4. Trust proxy and configure session
app.set('trust proxy', 1); // Trust first proxy in production

const sessionConfig = {
  name: 'ajs.sid', // Custom session cookie name
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native' // Native MongoDB TTL index
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? 'ajshoestore.vercel.app' : undefined
  }
};

app.use(session(sessionConfig));
app.use(cookieParser(process.env.COOKIE_SECRET)); // Signed cookies
app.use(express.json({ limit: '10kb' })); // Body limit

// 5. Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: 'majority',
      tls: process.env.NODE_ENV === 'production',
      tlsAllowInvalidCertificates: false
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

connectDB();

// 6. Routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AJ Shoe Store API',
    documentation: 'https://docs.your-api.com'
  });
});

// Apply rate limiting to auth routes
app.use('/api/auth', apiLimiter, require('./routes/authRoute'));

// 7. Error Handling Middleware
app.use(logErrors);
app.use(errorHandler);

// 8. Handle 404
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// 9. Server Setup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 10. Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});

// 11. Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => console.log('💥 Process terminated'));
});