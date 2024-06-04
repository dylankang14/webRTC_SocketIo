const socket = io();

const roomForm = document.querySelector("#welcome > form");
const chatRoom = document.querySelector("#room");
const nameBox = document.querySelector("#name");
const roomList = document.querySelector("#room_list");
const messageForm = chatRoom.querySelector("form");
const roomTitle = chatRoom.querySelector("h3");
roomForm.hidden = true;
chatRoom.hidden = true;

let roomName;

function handleNickname(e) {
	e.preventDefault();
	nameBox.hidden = true;
	roomForm.hidden = false;
	const input = nameBox.querySelector("input");
	socket.emit("nickname", input.value);
	const intro = document.createElement("h3");
	const container = document.querySelector("main");
	intro.innerText = `${input.value} welcome~!`;
	container.prepend(intro);
}
function enterRoom(newCount) {
	roomTitle.innerText = "";
	roomForm.hidden = true;
	chatRoom.hidden = false;
	roomTitle.innerText = `Room ${roomName}, now ${newCount}`;
}

function addMessage(msg) {
	const ul = chatRoom.querySelector("ul");
	const li = document.createElement("li");
	li.innerText = msg;
	ul.appendChild(li);
}
roomForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const input = roomForm.querySelector("input");
	roomName = input.value;
	socket.emit("enter_room", input.value, enterRoom);
	input.value = "";
});
function sendMessage(e) {
	e.preventDefault();
	const input = messageForm.querySelector("input");
	const value = input.value;
	socket.emit("new_msg", value, roomName, () => {
		addMessage(`You: ${value}`);
	});
	input.value = "";
}

messageForm.addEventListener("submit", sendMessage);
nameBox.addEventListener("submit", handleNickname);

socket.on("welcome", (name, newCount) => {
	addMessage(`${name} join~!`);
	enterRoom(newCount);
});
socket.on("bye", (name, newCount) => {
	addMessage(`${name} left...`);
	enterRoom(newCount);
});
socket.on("new_msg", addMessage);

socket.on("room_change", (rooms) => {
	console.log(rooms);
	roomList.innerText = "";
	rooms.forEach((room) => {
		const li = document.createElement("li");
		li.innerText = room;
		roomList.append(li);
	});
});
