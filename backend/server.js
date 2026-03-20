require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const { connectDB } = require('./src/config/db');

const startVaccinationReminderJob = require('./src/utils/vaccinationReminder');

const app = express();

// Connect to MongoDB
connectDB();

// Start cron jobs
startVaccinationReminderJob();

// Middlewares
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',         require('./src/routes/auth.routes'));
app.use('/api/users',        require('./src/routes/user.routes'));
app.use('/api/cases',        require('./src/routes/case.routes'));
app.use('/api/patients',     require('./src/routes/patient.routes'));
app.use('/api/vaccinations', require('./src/routes/vaccination.routes'));
app.use('/api/animals',      require('./src/routes/animal.routes'));
app.use('/api/activity',     require('./src/routes/activityLog.routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));