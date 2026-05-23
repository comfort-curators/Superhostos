import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

app.use(pinoHttp({ logger }));

// CORS - Vercel frontend + local dev
const allowedOrigins = [
  'http://localhost:5173',
  'https://superhostos.com',
  'https://www.superhostos.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// JWT Middleware
export const verifyJWT = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Routes
app.get('/api/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/protected', verifyJWT, (req, res) => {
  res.json({ message: 'You are authenticated', user: (req as any).user });
});

app.get('/api/properties', (req, res) => {
  res.json([
    { id: 'PROP001', name: 'Azure Bay Villa', city: 'Malibu', bedrooms: 4 },
    { id: 'PROP002', name: 'Alpine Chalet', city: 'Aspen', bedrooms: 6 },
  ]);
});

app.listen(PORT, () => {
  logger.info(`🚀 API running on port ${PORT}`);
});
