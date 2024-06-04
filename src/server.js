import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
	cors: {
		origin: ["https://admin.socket.io"],
		credentials: true,
	},
});
instrument(wsServer, {
	auth: false,
	mode: "development",
});

function getPublicRooms() {
	const {
		sockets: {
			adapter: { rooms, sids },
		},
	} = wsServer;
	const publicRooms = [];
	rooms.forEach((val, key) => {
		if (sids.get(key) === undefined) publicRooms.push(key);
	});
	return publicRooms;
}

function countUsersRoom(room) {
	return wsServer.sockets.adapter.rooms.get(room)?.size;
}

wsServer.on("connection", (socket) => {
	socket["nickname"] = "Anon";
	socket.on("enter_room", (roomName, done) => {
		socket.join(roomName);
		done(countUsersRoom(roomName));
		socket.to(roomName).emit("welcome", socket["nickname"], countUsersRoom(roomName));
		wsServer.sockets.emit("room_change", getPublicRooms());
	});

	socket.on("nickname", (name) => {
		socket["nickname"] = name;
	});

	socket.on("new_msg", (msg, room, done) => {
		socket.to(room).emit("new_msg", `${socket["nickname"]} : ${msg}`);
		done();
	});

	socket.on("disconnecting", () => {
		socket.rooms.forEach((room) => socket.to(room).emit("bye", socket["nickname"], countUsersRoom(room) - 1));
	});
	socket.on("disconnect", () => {
		wsServer.sockets.emit("room_change", getPublicRooms());
	});
});

// const wss = new WebSocketServer({ server });
// const sockets = [];
// wss.on("connection", (socket) => {
// 	sockets.push(socket);
// 	console.log("Connected from client~!");
// 	socket["nickname"] = "Anonymous";
// 	socket.on("close", () => console.log("User leave~!!"));
// 	socket.on("message", (message) => {
// 		const msg = JSON.parse(message);
// 		switch (msg.type) {
// 			case "nickname":
// 				socket["nickname"] = msg.payload;
// 				break;
// 			case "new_message":
// 				sockets.forEach((aSocket) => {
// 					aSocket.send(`${socket.nickname} : ${msg.payload}`);
// 				});
// 				break;
// 		}
// 	});
// });

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);
