import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Allow CORS in development (Vite dev server uses a different port)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

// Rate-limit API endpoints (100 requests per minute per IP)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Mount API routes with rate limiting
app.use('/api', apiLimiter, apiRouter);

// Serve built frontend in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback: return index.html for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Argus server running on http://localhost:${PORT}`);
});
