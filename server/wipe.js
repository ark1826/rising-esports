import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Ranking } from './models/Ranking.js';
import { Slot } from './models/Slot.js';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const forceCleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Ranking.deleteMany({});
    await Slot.deleteMany({});
    console.log('Database wiped dry.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
};

forceCleanup();
