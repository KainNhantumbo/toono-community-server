import 'dotenv/config';
import cors from 'cors';

export const DOMAINS = String(process.env?.ALLOWED_DOMAINS).split(',') || [];

export const corsOptions = cors({
  origin: DOMAINS,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200
});
