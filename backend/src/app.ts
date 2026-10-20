import express from "express";
import { corsMiddleware } from "./middlewares/cors";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFound";
import routes from "./routes";

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
