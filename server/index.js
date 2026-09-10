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

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://localhost:")) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Requested-With",
        "Accept",
        "Accept-Version",
        "Content-Length",
        "Content-MD5",
        "Date",
        "X-Api-Version"
    ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. URL Normalization Middleware (ensures Vercel serverless requests route properly)
app.use((req, res, next) => {
    // If Vercel or a proxy rewrote the request URL to /index.js, restore from matched path header
    if (req.url === '/index.js' || req.url.startsWith('/index.js?') || req.url.startsWith('/server/index.js')) {
        const matchedPath = req.headers['x-matched-path'] || req.headers['x-forwarded-url'] || req.headers['x-vercel-matched-path'];
        if (matchedPath && matchedPath !== '/index.js' && !matchedPath.endsWith('/index.js')) {
            const queryIndex = req.url.indexOf('?');
            const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';
            req.url = matchedPath + (queryString && !matchedPath.includes('?') ? queryString : '');
        }
    }
    next();
});

// 3. Body parsers
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf ? buf.toString('utf8') : '';
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Database Connection Logic (Serverless Optimization)
let isSeeded = false;

const initializeApp = async() => {
    await connectDB();
    if (!isSeeded) {
        await seedData();
        isSeeded = true;
    }
};

// Initialize connection on cold start
initializeApp();

// Ensure DB is ready for every request in serverless
app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (e) {
        // continue, connectDB logs error
    }
    next();
});

// 5. Routes (mounted on both /api/... and /... for maximum routing compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/rankings', rankingRoutes);
app.use('/rankings', rankingRoutes);

app.use('/api/slots', slotRoutes);
app.use('/slots', slotRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

app.use('/api/bookings', bookingRoutes);
app.use('/bookings', bookingRoutes);

app.use('/api/webhooks/cashfree', cashfreeWebhookRoutes);
app.use('/webhooks/cashfree', cashfreeWebhookRoutes);

app.use('/api/tournaments', tournamentRoutes);
app.use('/tournaments', tournamentRoutes);

// Health check routes
app.get("/", (req, res) => res.send("Rising Esports API is running..."));
app.get("/api", (req, res) => res.send("Rising Esports API is running..."));
app.get("/index.js", (req, res) => res.send("Rising Esports API is running..."));

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
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
}

export default app;