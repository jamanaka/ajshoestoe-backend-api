require('dotenv').config();
const express = require('express');
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

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

// Session config
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
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

// Auth routes
app.use('/api/auth', require('./routes/authRoute'));

app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
