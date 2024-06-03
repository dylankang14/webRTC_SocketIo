import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const sockets = [];
wss.on("connection", (socket) => {
	sockets.push(socket);
	console.log("Connected from client~!");
	socket["nickname"] = "Anonymous";
	socket.on("close", () => console.log("User leave~!!"));
	socket.on("message", (message) => {
		const msg = JSON.parse(message);
		switch (msg.type) {
			case "nickname":
				socket["nickname"] = msg.payload;
				break;
			case "new_message":
				sockets.forEach((aSocket) => {
					aSocket.send(`${socket.nickname} : ${msg.payload}`);
				});
				break;
		}
		// console.log(message.toString("utf8"));
	});
});

const handleListen = () => console.log("Listening on http://localhost:3000");
// app.listen(3000, handleListen);
server.listen(3000, handleListen);
