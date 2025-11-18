import express, { Request, Response } from "express";
import http from "http";
import * as dotenv from "dotenv";
import cors from "cors";
import WebSocket, { WebSocketServer } from "ws";
import mongoose from "mongoose";
import crypto from "crypto"

dotenv.config();

// const mongoUri = process.env.MONGO_URI! as string;

// mongoose
// 	.connect(mongoUri)
// 	.then(() => console.log("Successfully connected to mongo db!"))
// 	.catch((e) => console.log("error connecting to the db -> ", e));

const app = express();
app.use(express.json());

const server = http.createServer(app);
const port = 5001;

const users: Map<String, WebSocket> = new Map();

const wss = new WebSocketServer({ server });
wss.on('connection', (ws: WebSocket)=>{
	console.log("New Web Socket Connection!");
	let id = crypto.randomBytes(5).toString('hex');
	while(users.has(id)){
		id = crypto.randomBytes(16).toString('hex');
	}

	console.log(`User ${id} has joined`);

	users.set(id, ws);
	ws.on("message", (message: WebSocket.Data)=>{
		console.log('A message has been sent');
		console.log('Message -> ', message);

		const {inputType, pos, data} = JSON.parse(message.toString());

		for(const userId of users.keys()){
			if(userId === id) continue;
			users.get(userId)?.send(JSON.stringify({
        			inputType,
                    pos, 
                    data
                }));
		}
	});

	ws.on("close", ()=>{
		users.delete(id);
		console.log("Connection closed");
	})
});

const corsOptions = {
	origin: "*", // Allow requests from this origin
	methods: ["GET", "POST", "PUT"], // Allow specific methods
	allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
};

// Use the CORS middleware
app.use(cors(corsOptions));

server.listen(port, () => {
	console.log(`Listening on port ${port}. Let's go!`);
});
