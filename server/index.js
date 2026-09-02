import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import rankingRoutes from './routes/rankings.js';
import slotRoutes from './routes/slots.js';
import userRoutes from './routes/users.js';
import bookingRoutes from './routes/bookings.js';
import cashfreeWebhookRoutes from './routes/cashfreeWebhook.js';
import tournamentRoutes from './routes/tournaments.js';
import { Admin } from './models/Admin.js';
import { Ranking } from './models/Ranking.js';
import { Slot } from './models/Slot.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();

// 1. CORS Configuration
// Note: If you kept the 'headers' in vercel.json, this middleware 
// acts as a second layer of defense.
app.use(
    cors({
        origin: function(origin, callback) {
            if (!origin) return callback(null, true);
            const allowedOrigins = [
                "https://rising-esports-wvay.vercel.app",
                "https://www.risingesports.online",
                "https://rising-esports-c124a6vc1-ark1826s-projects.vercel.app",
                "https://risingesports.online",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:5173"
            ];
            if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://localhost:")) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// 2. Body parsers
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf ? buf.toString('utf8') : '';
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Database Connection Logic (Serverless Optimization)
// We connect to the DB but don't let seeding block the initial boot-up
let isSeeded = false;

const initializeApp = async() => {
    await connectDB();
    if (!isSeeded) {
        await seedData();
        isSeeded = true;
    }
};

// Initialize connection (Vercel will reuse this connection across requests)
initializeApp();

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/webhooks/cashfree', cashfreeWebhookRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Health check route
app.get("/", (req, res) => res.send("Rising Esports API is running..."));

// 6. Seeding Logic (Keep this exactly as you had it, it's safe)
const defaultRankings = [ /* ... your data ... */ ];
const defaultSlots = [ /* ... your data ... */ ];

const seedData = async() => {
    try {
        const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
        const adminPassword = (process.env.ADMIN_PASSWORD || 'admin@123').trim();

        const admin = await Admin.findOne({ username: adminUsername });
        if (!admin) {
            await Admin.create({ username: adminUsername, password: adminPassword });
            console.log('Default admin created');
        } else {
            admin.password = adminPassword;
            await admin.save();
            console.log('Admin password synced with env variables');
        }
        // ... rest of your seeding logic ...
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

// 7. The "Listen" vs "Export"
// On Vercel, we EXPORT the app. app.listen is only for local dev.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
}

export default app;