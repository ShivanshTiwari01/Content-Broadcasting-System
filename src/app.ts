import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import router from './routes.js';

import {
  errorHandler,
  notFoundHandler,
} from './middlewares/error.middleware.js';
import chalk from 'chalk';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: express.Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);

app.use((req, res, next) => {
  console.log(`${chalk.blue(req.method)} ${chalk.green(req.url)}`);
  next();
});

app.get('/', (req, res) => {
  res.send('ACCESS BLOCKED');
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Content Broadcast System is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.use('/api', router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
