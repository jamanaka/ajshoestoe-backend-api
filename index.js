require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const MongoDBStore = require("connect-mongodb-session")(session);

const app = express();

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

const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

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


const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
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

// 6. Routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AJ Shoe Store API',
    documentation: 'https://docs.your-api.com'
  });
});

app.use('/api/auth', require('./routes/authRoute'));

// 9. Server Setup
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});