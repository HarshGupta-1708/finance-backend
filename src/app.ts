import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { generalLimiter } from './middlewares/rateLimiter.middleware';

import authRoutes from './modules/auth/auth.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import recordsRoutes from './modules/records/records.routes';
import usersRoutes from './modules/users/users.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined'));
app.use(generalLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Root route - Professional API landing page
app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Finance Dashboard API</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh;padding:2rem 1rem}
    .hero{text-align:center;padding:2.5rem 1rem 2rem}
    .logo{display:inline-flex;align-items:center;gap:10px;background:#1e2330;border:1px solid #2d3748;border-radius:12px;padding:10px 18px;margin-bottom:1.5rem}
    .dot{width:10px;height:10px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    h1{font-size:2rem;font-weight:700;color:#f1f5f9;margin-bottom:.4rem}
    .subtitle{color:#94a3b8;font-size:.95rem}
    .badge{display:inline-block;background:#1a2744;color:#60a5fa;border:1px solid #2563eb44;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:500;margin:.6rem .2rem 0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:860px;margin:1.8rem auto}
    .stat{background:#1e2330;border:1px solid #2d3748;border-radius:12px;padding:1.1rem 1rem}
    .stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:.4rem}
    .stat-val{font-size:1.35rem;font-weight:600;color:#f1f5f9}
    .section{max-width:860px;margin:0 auto 1.8rem}
    .section-title{font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin-bottom:.8rem;padding-left:2px}
    .endpoints{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
    .ep{background:#1e2330;border:1px solid #2d3748;border-radius:10px;padding:.7rem 1rem;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit;transition:border-color .15s}
    .ep:hover{border-color:#3b82f6}
    .method{font-size:10px;font-weight:700;background:#1a2744;color:#60a5fa;border-radius:5px;padding:2px 7px}
    .ep-path{font-size:13px;font-family:monospace;color:#cbd5e1}
    .features{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
    .feat{background:#1e2330;border:1px solid #2d3748;border-radius:10px;padding:.65rem 1rem;font-size:13px;color:#94a3b8;display:flex;align-items:center;gap:8px}
    .check{width:16px;height:16px;border-radius:50%;background:#0f2e1a;border:1px solid #22c55e;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:9px;color:#22c55e}
    .footer{text-align:center;color:#334155;font-size:12px;margin-top:2rem}
    .stack{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:.6rem}
    .tag{background:#1e2330;border:1px solid #2d3748;border-radius:6px;padding:3px 10px;font-size:11px;color:#64748b}
    a.ep-docs{border-color:#2563eb44}
    a.ep-docs:hover{border-color:#3b82f6;background:#1a2744}
  </style>
</head>
<body>

<div class="hero">
  <div class="logo">
    <div class="dot"></div>
    <span style="font-size:13px;font-weight:600;color:#94a3b8">finance-backend</span>
    <span style="background:#0f2e1a;color:#22c55e;border:1px solid #22c55e44;border-radius:20px;padding:2px 10px;font-size:11px">v1.0.0</span>
  </div>
  <h1>Finance Dashboard API</h1>
  <p class="subtitle">Secure &nbsp;·&nbsp; Role-Based &nbsp;·&nbsp; Production Ready</p>
  <div>
    <span class="badge">PostgreSQL (Neon)</span>
    <span class="badge">Redis</span>
    <span class="badge">JWT Auth</span>
    <span class="badge">TypeScript</span>
  </div>
</div>

<div class="grid">
  <div class="stat">
    <div class="stat-label">Status</div>
    <div class="stat-val" style="color:#22c55e">&#9679; Running</div>
  </div>
  <div class="stat">
    <div class="stat-label">Environment</div>
    <div class="stat-val" style="font-size:1rem">${process.env.NODE_ENV || 'production'}</div>
  </div>
  <div class="stat">
    <div class="stat-label">Uptime</div>
    <div class="stat-val" style="font-size:1rem">${Math.floor(process.uptime())}s</div>
  </div>
  <div class="stat">
    <div class="stat-label">Timestamp</div>
    <div class="stat-val" style="font-size:.85rem">${new Date().toUTCString()}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Endpoints</div>
  <div class="endpoints">
    <a class="ep ep-docs" href="/api/docs">
      <span class="method" style="background:#1e1a40;color:#a78bfa">DOCS</span>
      <span class="ep-path">/api/docs</span>
    </a>
    <a class="ep" href="/health">
      <span class="method">GET</span>
      <span class="ep-path">/health</span>
    </a>
    <div class="ep"><span class="method">AUTH</span><span class="ep-path">/api/auth</span></div>
    <div class="ep"><span class="method">GET</span><span class="ep-path">/api/users</span></div>
    <div class="ep"><span class="method">GET</span><span class="ep-path">/api/records</span></div>
    <div class="ep"><span class="method">GET</span><span class="ep-path">/api/categories</span></div>
    <div class="ep"><span class="method">GET</span><span class="ep-path">/api/dashboard</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Features</div>
  <div class="features">
    <div class="feat"><div class="check">&#10003;</div>User &amp; Role Management</div>
    <div class="feat"><div class="check">&#10003;</div>Financial Records CRUD</div>
    <div class="feat"><div class="check">&#10003;</div>Dashboard Analytics</div>
    <div class="feat"><div class="check">&#10003;</div>JWT Auth (7 days)</div>
    <div class="feat"><div class="check">&#10003;</div>Rate Limiting</div>
    <div class="feat"><div class="check">&#10003;</div>Pagination &amp; Search</div>
    <div class="feat"><div class="check">&#10003;</div>Soft Delete</div>
    <div class="feat"><div class="check">&#10003;</div>Role-Based Access</div>
  </div>
</div>

<div class="footer">
  <div class="stack">
    <span class="tag">Node.js</span>
    <span class="tag">TypeScript</span>
    <span class="tag">Express</span>
    <span class="tag">Prisma</span>
    <span class="tag">PostgreSQL</span>
    <span class="tag">Redis</span>
  </div>
  <p style="margin-top:.8rem">Finance Dashboard API &nbsp;·&nbsp; Built by Harsh Gupta</p>
</div>

</body>
</html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'Finance Dashboard API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    hint: 'Visit / for API info or /api/docs for Swagger documentation',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
