import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import rankingRoutes from './routes/rankings.js';
import slotRoutes from './routes/slots.js';
import { Admin } from './models/Admin.js';
import { Ranking } from './models/Ranking.js';
import { Slot } from './models/Slot.js';

dotenv.config();

const app = express();

// 1. CORS Configuration
// Note: If you kept the 'headers' in vercel.json, this middleware 
// acts as a second layer of defense.
app.use(
  cors({
    origin: [
      "https://rising-esports-wvay.vercel.app",
      "https://www.risingesports.online",        
      "https://rising-esports-c124a6vc1-ark1826s-projects.vercel.app",        
      "https://risingesports.online",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// 2. Database Connection Logic (Serverless Optimization)
// We connect to the DB but don't let seeding block the initial boot-up
let isSeeded = false;

const initializeApp = async () => {
  await connectDB();
  if (!isSeeded) {
    await seedData();
    isSeeded = true;
  }
};

// Initialize connection (Vercel will reuse this connection across requests)
initializeApp();

// 3. Routes
app.use('/api/auth', authRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/slots', slotRoutes);

// Health check route
app.get("/", (req, res) => res.send("Rising Esports API is running..."));

// 4. Seeding Logic (Keep this exactly as you had it, it's safe)
const defaultRankings = [ /* ... your data ... */ ];
const defaultSlots = [ /* ... your data ... */ ];

const seedData = async () => {
  try {
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      await Admin.create({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin@123' });
      console.log('Default admin created');
    }
    // ... rest of your seeding logic ...
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

// 5. The "Listen" vs "Export"
// On Vercel, we EXPORT the app. app.listen is only for local dev.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
}

export default app;