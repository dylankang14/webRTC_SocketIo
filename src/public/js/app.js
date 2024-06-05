const socket = io();

const myFace = document.getElementById("myFace");
const btnMute = document.getElementById("mute");
const btnCameraOff = document.getElementById("cameraOff");
const cameraSelect = document.getElementById("cameras");

let myStream;
let mute = false;
let cameraOff = false;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
	try {
		const cameras = (await navigator.mediaDevices.enumerateDevices()).filter((camera) => camera.kind === "videoinput");
		const currentCamera = myStream.getVideoTracks()[0];
		cameras.forEach((camera) => {
			const option = document.createElement("option");
			option.value = camera.deviceId;
			option.label = camera.label;
			if (currentCamera.label === camera.label) {
				option.selected = true;
			}
			cameraSelect.append(option);
		});
	} catch (error) {
		console.log(error);
	}
}

async function getMedia(cameraId) {
	const initialConstraints = {
		audio: true,
		video: true,
	};
	const currentConstraints = {
		audio: true,
		video: { deviceId: { exact: cameraId } },
	};

	try {
		myStream = await navigator.mediaDevices.getUserMedia(cameraId ? currentConstraints : initialConstraints);
		if (!cameraId) await getCameras();
		myFace.srcObject = myStream;
	} catch (error) {
		console.log(error);
	}
}

function handleMuteClick(e) {
	myStream.getAudioTracks().forEach((track) => {
		track.enabled = !track.enabled;
	});
	if (!mute) {
		btnMute.innerText = "Unmute";
		mute = true;
	} else {
		btnMute.innerText = "Mute";
		mute = false;
	}
}
function handleCameraClick(e) {
	myStream.getVideoTracks().forEach((track) => {
		track.enabled = !track.enabled;
	});
	if (!cameraOff) {
		btnCameraOff.innerText = "Camera On";
		cameraOff = true;
	} else {
		btnCameraOff.innerText = "Camera Off";
		cameraOff = false;
	}
}
async function handleCameraChange(e) {
	await getMedia(this.value);
	const streamVideo = myStream.getVideoTracks()[0];
	const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
	videoSender.replaceTrack(streamVideo);
}
btnMute.addEventListener("click", handleMuteClick);
btnCameraOff.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// start webRTC
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const call = document.getElementById("call");
const peerFace = document.getElementById("peerFace");

call.hidden = true;

async function startMedia() {
	welcome.hidden = true;
	call.hidden = false;
	await getMedia();
	makeConnection();
}

let roomName;

async function handleWelcomeSubmit(e) {
	e.preventDefault();
	const input = welcomeForm.querySelector("input");
	roomName = input.value;
	await startMedia();
	socket.emit("join_room", input.value);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// start socketio
socket.on("welcome", async () => {
	myDataChannel = myPeerConnection.createDataChannel("chat");
	myDataChannel.addEventListener("message", console.log);
	console.log("My data channel created!");
	const offer = await myPeerConnection.createOffer();
	myPeerConnection.setLocalDescription(offer);
	socket.emit("offer", offer, roomName);
	console.log("send offer to B");
});

socket.on("offer", async (offer) => {
	myPeerConnection.addEventListener("datachannel", (e) => {
		myDataChannel = e.channel;
		myDataChannel.addEventListener("message", console.log);
	});
	console.log("received offer from A");
	myPeerConnection.setRemoteDescription(offer);
	const answer = await myPeerConnection.createAnswer();
	myPeerConnection.setLocalDescription(answer);
	socket.emit("answer", answer, roomName);
	console.log("send answer from B");
});

socket.on("answer", (answer) => {
	console.log("received answer from B");
	myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
	console.log("received ice");
	myPeerConnection.addIceCandidate(ice);
});

// RTC code
function makeConnection() {
	myPeerConnection = new RTCPeerConnection({
		iceServers: [
			{
				urls: [
					"stun:stun.l.google.com:19302",
					"stun:stun1.l.google.com:19302",
					"stun:stun2.l.google.com:19302",
					"stun:stun3.l.google.com:19302",
					"stun:stun4.l.google.com:19302",
				],
			},
		],
	});
	myPeerConnection.addEventListener("icecandidate", handleIce);
	myPeerConnection.addEventListener("track", handleTrackConnection);
	myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
	console.log("send ice");
	socket.emit("ice", data.candidate, roomName);
}

function handleTrackConnection(data) {
	console.log("peer stream", data.streams[0]);
	console.log("my stream", myStream);
	peerFace.srcObject = data.streams[0];
}
