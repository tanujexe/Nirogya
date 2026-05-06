const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { errorHandler } = require('./middleware/errorMiddleware');
const { notFound } = require('./middleware/notFoundMiddleware');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const labRoutes = require('./routes/labRoutes');
const bloodBankRoutes = require('./routes/bloodBankRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const recordRoutes = require('./routes/recordRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const providerRoutes = require('./routes/providerRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// ── Body Parsers (MUST be first so req.body is populated) ─────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Safe MongoDB injection sanitizer — compatible with Node.js v24+
// express-mongo-sanitize v2 tries to reassign req.query (a read-only getter in Node 24)
// Instead, we manually sanitize req.body and req.params only.
app.use((req, _res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  // req.query is intentionally skipped — it's a read-only getter in Node 24+
  next();
});

app.use(hpp());
app.use(apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/doctors',      doctorRoutes);
app.use('/api/bookings',     bookingRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/hospitals',    hospitalRoutes);
app.use('/api/lab-tests',    labRoutes);
app.use('/api/bloodbanks',   bloodBankRoutes);
app.use('/api/ambulances',   ambulanceRoutes);
app.use('/api/records',      recordRoutes);
app.use('/api/reviews',      reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/providers',     providerRoutes);
app.use('/api/ai',            aiRoutes);

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Nirogya API Server Running ✅' });
});

// ── Error Handling ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
// trigger restart
// restart proxy
// restart proxy again
