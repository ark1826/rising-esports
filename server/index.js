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

app.use(
  cors({
    origin: "https://rising-esports-5339tfpdq-ark1826s-projects.vercel.app",
    credentials: true,
  })
);
app.use(express.json());
app.options("*", cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/slots', slotRoutes);

const PORT = process.env.PORT || 5000;

// Default Mock Data
const defaultRankings = [
  { rank: 1, teamName: 'GodLike Esports', teamTag: 'GodL', totalMatches: 250, finishes: 134, wwcd: 12, totalPoints: 245 },
  { rank: 2, teamName: 'Team Soul', teamTag: 'SOUL', totalMatches: 245, finishes: 112, wwcd: 9, totalPoints: 210 },
  { rank: 3, teamName: 'Blind Esports', teamTag: 'BLND', totalMatches: 240, finishes: 105, wwcd: 8, totalPoints: 195 },
  { rank: 4, teamName: 'Gladiators Esports', teamTag: 'GLXT', totalMatches: 235, finishes: 98, wwcd: 7, totalPoints: 180 },
  { rank: 5, teamName: 'Global Esports', teamTag: 'GE', totalMatches: 230, finishes: 89, wwcd: 6, totalPoints: 165 },
];

const defaultSlots = [
  { entryFee: 50, prizePool: [{ position: 1, amount: 350 }, { position: 2, amount: 120 }, { position: 3, amount: 90 }, { position: 4, amount: 60 }] },
  { entryFee: 60, prizePool: [{ position: 1, amount: 450 }, { position: 2, amount: 150 }, { position: 3, amount: 100 }, { position: 4, amount: 70 }] },
  { entryFee: 120, prizePool: [{ position: 1, amount: 900 }, { position: 2, amount: 400 }, { position: 3, amount: 250 }, { position: 4, amount: 150 }] },
  { entryFee: 150, prizePool: [{ position: 1, amount: 1250 }, { position: 2, amount: 500 }, { position: 3, amount: 300 }, { position: 4, amount: 200 }] }
];

// Seed Data helper (after connection)
const seedData = async () => {
  try {
    // Seed Admin
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      await Admin.create({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'admin@123' });
      console.log('Default admin created: admin / admin@123');
    }

    // Seed Rankings one by one to avoid duplicates
    for (const ranking of defaultRankings) {
      const exists = await Ranking.findOne({ teamName: ranking.teamName });
      if (!exists) {
        await Ranking.create(ranking);
      }
    }
    console.log('Rankings checked/seeded');

    // Seed Slots one by one to avoid duplicates
    for (const slot of defaultSlots) {
      const exists = await Slot.findOne({ entryFee: slot.entryFee });
      if (!exists) {
        await Slot.create(slot);
      }
    }
    console.log('Slots checked/seeded');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Start Server
const startServer = async () => {
  try {
    await connectDB(); // ✅ wait for DB FIRST

    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
      await seedData(); // ✅ runs AFTER DB connection
    });

  } catch (error) {
    console.error("Startup error:", error);
  }
};

startServer();
