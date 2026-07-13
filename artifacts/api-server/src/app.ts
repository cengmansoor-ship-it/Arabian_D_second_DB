import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { apiLimiter, loginLimiter } from "./middlewares/rateLimits";
import { csrfProtection } from "./middlewares/csrf";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

const app: Express = express();

app.use(
  helmet({
    // Same-origin API served behind a proxy; CSP is enforced by the frontend app itself.
    contentSecurityPolicy: false,
  }),
);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
app.use("/api/auth/login", loginLimiter);
app.use(csrfProtection);

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
