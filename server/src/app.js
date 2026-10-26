import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import auth from "./routes/auth.js";
import oauth from "./routes/oauth.js";
const app = express();
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
function isLocalDevelopmentOrigin(origin) {
  try {
    const url = new URL(origin);
    return (
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalDevelopmentOrigin(origin)
      )
        return callback(null, true);
      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.get("/api/health", (_, res) =>
  res.json({ ok: true, service: "LifeOS API" }),
);
app.use("/api/auth", auth);
app.use("/api/auth", oauth);
app.use((req, res) =>
  res.status(404).json({ error: { message: "Route not found" } }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({
      error: { message: err.status ? err.message : "Internal server error" },
    });
});
export default app;
