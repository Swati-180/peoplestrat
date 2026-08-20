import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import optimizationRoutes from "./routes/optimizationRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import successionRoutes from "./routes/successionRoutes.js";
import pipelineRoutes from "./routes/pipelineRoutes.js";
import employeePortalRoutes from './routes/employeePortalRoutes.js';
import userRoutes from './routes/user.js';
import seedDatabase from './seed.js';
import User from './models/User.js';

const app = express();

// Deployment Environment Validation
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

// Security Middleware
app.use(helmet());
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api', limiter);

// Base Route
app.get('/', (req, res) => res.send('AI Workforce API Running securely'));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/optimization", optimizationRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/succession", successionRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/employee", employeePortalRoutes);
app.use("/api/user", userRoutes);

// Fallback for old routes or additional ones if needed
// app.use("/api/ai", aiRoutes); // I'll convert aiController to ESM if needed later

// Server Execution
const startServer = async () => {
  try {
    await connectDB();
    console.log('Database connection established successfully.');

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty, automatically seeding demo data...');
      await seedDatabase();
    }

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
};

startServer();
