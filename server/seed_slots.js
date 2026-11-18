import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { Slot } from './models/Slot.js';

dotenv.config();
// Set Google DNS to ensure reliable resolution on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

const standardSlots = [
  // ── 1. DAILY SCRIMS: Afternoon Slot ──
  {
    matchName: 'RISING 1-3 GRIND SCRIMS',
    category: 'SCRIMS',
    lobby: 'LOBBY 1',
    date: 'Today',
    timing: '02:00 PM',
    mode: 'Squad TPP',
    entryFee: 60,
    price: 60,
    prizePoolTotal: 5000,
    maxTeams: 20,
    maps: ['ERANGEL', 'MIRAMAR', 'RONDO'],
    registrationStatus: 'Open',
    isPublished: true,
    description: 'Daily afternoon competitive grind scrims for serious teams. Tier 1 & Tier 2 practice.',
    rules: '1. Emulators/iPads strictly banned. 2. Matches start on time. 3. Respect your assigned team slot.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '02:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '02:45 PM', map: 'MIRAMAR' },
      { matchNumber: 3, label: 'MATCH 3', time: '03:30 PM', map: 'RONDO' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹2,500' },
      { rank: '#2', prize: '₹1,500' },
      { rank: '#3', prize: '₹1,000' },
    ],
  },

  // ── 2. DAILY SCRIMS: Evening Slot ──
  {
    matchName: 'RISING 4-6 PRIME SCRIMS',
    category: 'SCRIMS',
    lobby: 'LOBBY 1',
    date: 'Today',
    timing: '04:00 PM',
    mode: 'Squad TPP',
    entryFee: 60,
    price: 60,
    prizePoolTotal: 5000,
    maxTeams: 20,
    maps: ['ERANGEL', 'RONDO', 'MIRAMAR'],
    registrationStatus: 'Open',
    isPublished: true,
    description: 'Prime evening scrims for competitive squads testing new rotations.',
    rules: '1. Emulators/iPads strictly banned. 2. Matches start on time. 3. Respect your assigned team slot.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '04:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '04:45 PM', map: 'RONDO' },
      { matchNumber: 3, label: 'MATCH 3', time: '05:30 PM', map: 'MIRAMAR' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹2,500' },
      { rank: '#2', prize: '₹1,500' },
      { rank: '#3', prize: '₹1,000' },
    ],
  },

  // ── 3. DAILY SCRIMS: Sunset Slot ──
  {
    matchName: 'RISING 6-8 PRO SCRIMS',
    category: 'SCRIMS',
    lobby: 'LOBBY 1',
    date: 'Today',
    timing: '06:00 PM',
    mode: 'Squad TPP',
    entryFee: 60,
    price: 60,
    prizePoolTotal: 5000,
    maxTeams: 20,
    maps: ['ERANGEL', 'MIRAMAR', 'RONDO'],
    registrationStatus: 'Open',
    isPublished: true,
    description: 'High intensity sunset scrims featuring top competitive rosters.',
    rules: '1. Emulators/iPads strictly banned. 2. Matches start on time. 3. Respect your assigned team slot.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '06:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '06:45 PM', map: 'MIRAMAR' },
      { matchNumber: 3, label: 'MATCH 3', time: '07:30 PM', map: 'RONDO' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹2,500' },
      { rank: '#2', prize: '₹1,500' },
      { rank: '#3', prize: '₹1,000' },
    ],
  },

  // ── 4. DAILY SCRIMS: Night Prime ──
  {
    matchName: 'RISING 9-11 NIGHT SCRIMS',
    category: 'SCRIMS',
    lobby: 'LOBBY 1',
    date: 'Today',
    timing: '09:00 PM',
    mode: 'Squad TPP',
    entryFee: 60,
    price: 60,
    prizePoolTotal: 5000,
    maxTeams: 20,
    maps: ['ERANGEL', 'MIRAMAR', 'RONDO'],
    registrationStatus: 'Open',
    isPublished: true,
    description: 'Late night competitive lobby with full lobby broadcast and drop tracking.',
    rules: '1. Emulators/iPads strictly banned. 2. Matches start on time. 3. Respect your assigned team slot.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '09:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '09:45 PM', map: 'MIRAMAR' },
      { matchNumber: 3, label: 'MATCH 3', time: '10:30 PM', map: 'RONDO' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹2,500' },
      { rank: '#2', prize: '₹1,500' },
      { rank: '#3', prize: '₹1,000' },
    ],
  },

  // ── 5. WEEKLY WAR ──
  {
    matchName: 'RISING WEEKLY WAR CHAMPIONSHIP',
    category: 'WEEKLY WAR',
    lobby: 'LOBBY 1',
    date: 'Wednesday & Saturday',
    timing: '07:00 PM',
    mode: 'Squad TPP',
    entryFee: 100,
    price: 100,
    prizePoolTotal: 10000,
    maxTeams: 20,
    maps: ['ERANGEL', 'MIRAMAR', 'RONDO', 'SANHOK'],
    registrationStatus: 'Open',
    isPublished: true,
    description: 'Mid-week championship war with boosted prize pool and official ranking points.',
    rules: '1. Strict anti-cheat monitoring. 2. Recording POV required upon admin request.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '07:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '07:50 PM', map: 'MIRAMAR' },
      { matchNumber: 3, label: 'MATCH 3', time: '08:40 PM', map: 'RONDO' },
      { matchNumber: 4, label: 'MATCH 4', time: '09:30 PM', map: 'SANHOK' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹5,000' },
      { rank: '#2', prize: '₹3,000' },
      { rank: '#3', prize: '₹2,000' },
    ],
  },

  // ── 6. WEEKEND WAR ──
  {
    matchName: 'RISING WEEKEND SHOWDOWN',
    category: 'WEEKEND WAR',
    lobby: 'LOBBY 1',
    date: 'Saturday & Sunday',
    timing: '08:00 PM',
    mode: 'Squad TPP',
    entryFee: 150,
    price: 150,
    prizePoolTotal: 15000,
    maxTeams: 20,
    maps: ['ERANGEL', 'MIRAMAR', 'RONDO'],
    registrationStatus: 'Open',
    isPublished: true,
    description: 'Weekend battle royale showcase with ₹15,000 prize pool and streamer coverage.',
    rules: '1. Check-in mandatory 15 minutes before match. 2. No late entry permitted.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '08:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '08:50 PM', map: 'MIRAMAR' },
      { matchNumber: 3, label: 'MATCH 3', time: '09:40 PM', map: 'RONDO' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹7,500' },
      { rank: '#2', prize: '₹4,500' },
      { rank: '#3', prize: '₹3,000' },
    ],
  },

  // ── 7. GRANDS FINALS ──
  {
    matchName: 'RISING GRANDS INVITATIONAL FINALS',
    category: 'GRANDS',
    lobby: 'GRAND FINALS LOBBY',
    date: 'End of Month',
    timing: '06:00 PM',
    mode: 'Squad TPP',
    entryFee: 0,
    price: 0,
    prizePoolTotal: 50000,
    maxTeams: 20,
    maps: ['ERANGEL', 'MIRAMAR', 'RONDO', 'ERANGEL'],
    registrationStatus: 'Upcoming',
    isPublished: true,
    description: 'The ultimate monthly invitational for top tier teams across Rising Esports leaderboards.',
    rules: '1. Invite / qualification only. 2. Live stream broadcast with delay.',
    scheduleMatches: [
      { matchNumber: 1, label: 'MATCH 1', time: '06:00 PM', map: 'ERANGEL' },
      { matchNumber: 2, label: 'MATCH 2', time: '07:00 PM', map: 'MIRAMAR' },
      { matchNumber: 3, label: 'MATCH 3', time: '08:00 PM', map: 'RONDO' },
      { matchNumber: 4, label: 'MATCH 4', time: '09:00 PM', map: 'ERANGEL' },
    ],
    prizeDistribution: [
      { rank: '#1', prize: '₹25,000' },
      { rank: '#2', prize: '₹15,000' },
      { rank: '#3', prize: '₹10,000' },
    ],
  },
];

const seedAllSlots = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // Format today's date for daily scrims
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedToday = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    let createdCount = 0;
    for (const item of standardSlots) {
      if (item.date === 'Today') {
        item.date = formattedToday;
      }

      // Check if slot with same matchName and date exists
      const existing = await Slot.findOne({
        matchName: item.matchName,
        date: item.date,
      });

      if (!existing) {
        await Slot.create(item);
        console.log(` Created slot: ${item.matchName} (${item.timing})`);
        createdCount++;
      } else {
        console.log(`ℹ  Already exists: ${item.matchName} (${item.date})`);
      }
    }

    const total = await Slot.countDocuments();
    console.log(`\n Done! Created ${createdCount} new slots. Total slots in database: ${total}`);
    process.exit(0);
  } catch (err) {
    console.error(' Seeding failed:', err);
    process.exit(1);
  }
};

seedAllSlots();
