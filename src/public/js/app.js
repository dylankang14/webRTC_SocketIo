const socket = new WebSocket(`ws://${window.location.host}`);

const msgList = document.querySelector("ul");
const nickForm = document.querySelector("form#nickName");
const msgForm = document.querySelector("form#message");

function makeMsg(type, payload) {
	const message = { type, payload };
	return JSON.stringify(message);
}

socket.addEventListener("open", () => console.log("Connected to Server~!"));
socket.addEventListener("message", (message) => {
	const li = document.createElement("li");
	li.innerText = message.data;
	msgList.append(li);
});

socket.addEventListener("close", () => console.log("Disconnected from server~!!"));

function submitNickName(e) {
	e.preventDefault();
	let input = nickForm.querySelector("input");
	socket.send(makeMsg("nickname", input.value));
}
function submitMsg(e) {
	e.preventDefault();
	let input = msgForm.querySelector("input");
	socket.send(makeMsg("new_message", input.value));
	input.value = "";
}

nickForm.addEventListener("submit", submitNickName);
msgForm.addEventListener("submit", submitMsg);
