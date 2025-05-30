import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);

// Not found route
app.use((_, _, next) => {
  const error = new Error("Not Found");
  error.statusCode = 404;
  next(error);
});

// Error handler
app.use((err, _, res, _) => {
  res.status(+err.statusCode || 500).json({
    success: err.success,
    message: err.message,
    error: err.errors,
  });
});

export { app };
