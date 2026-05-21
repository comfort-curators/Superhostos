import express, { Express, Request, Response, NextFunction } from "express";
import pinoHttp from "pino-http";
import { z } from "zod";

// Initialize Express app
const app: Express = express();

// Configuration from environment
const PORT = parseInt(process.env.API_PORT || "8080", 10);
const HOST = process.env.API_HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// Logger middleware
const logger = pinoHttp({
  level: NODE_ENV === "production" ? "info" : "debug",
  transport: NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});

app.use(logger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.FRONTEND_URL || "https://superhostos.com",
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Ready check endpoint for Amplify
app.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check database connection here if available
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not-ready",
      error: "Service unavailable",
    });
  }
});

// API Routes
const apiRouter = express.Router();

// Example endpoint
apiRouter.get("/properties", (req: Request, res: Response) => {
  res.json({
    properties: [],
    message: "Properties endpoint - connect to database",
  });
});

app.use("/api", apiRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const status = (err as any).status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[${new Date().toISOString()}] Error:`, {
    status,
    message,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: {
      message,
      status,
      path: req.path,
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: "Not Found",
      status: 404,
      path: req.path,
    },
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(
    `[${new Date().toISOString()}] Server running at http://${HOST}:${PORT}`
  );
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Ready check: http://${HOST}:${PORT}/ready`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

export default app;
