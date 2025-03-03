import express, { Request, Response } from "express";
import http from "http";
import * as dotenv from "dotenv";
import cors from "cors";
import WebSocket, { WebSocketServer } from "ws";
import mongoose from "mongoose";

dotenv.config();

const mongoUri = process.env.MONGO_URI! as string;

mongoose
	.connect(mongoUri)
	.then(() => console.log("Successfully connected to mongo db!"))
	.catch((e) => console.log("error connecting to the db -> ", e));

const app = express();
app.use(express.json());

const server = http.createServer(app);
const port = 5000;

const wss = new WebSocketServer({ server });

const corsOptions = {
	origin: ["http://localhost:3000", "https://64squareschess.netlify.app"], // Allow requests from this origin
	methods: ["GET", "POST", "PUT"], // Allow specific methods
	allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
};

// Use the CORS middleware
app.use(cors(corsOptions));

server.listen(port, () => {
	console.log(`Listening on port ${port}. Let's go!`);
});
