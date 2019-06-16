import {
	RTCPeerConnection,
	RTCIceCandidate,
	RTCSessionDescription,
	MediaStream,
	MediaStreamTrack,
	mediaDevices
} from "react-native-webrtc";

export class WebRTC {
	peer = null;
	dataChannel = null;
	webSocketSignServer = null;
	username = "";
	otherUsername = "";
	ConnectionInfo = null;
	DataChannelMessage = (onaddstream = null);
	onremovestream = null;
	stream = null;
	sigServer=null;
	send(message) {
		this.dataChannel.send(message);
	}
	_closeStream() {
		if (this.stream) {
			this.stream.getTracks().forEach(t => t.stop());
			this.stream.release();
			this.stream = null;
		}
	}

	constructor(username, otherUsername, sigServer) {
		this.username = username;
		this.otherUsername = otherUsername;
		this.sigServer=sigServer;
	}
	_messageHandler(messageReceived) {
		let message = {};
		try {
			message = JSON.parse(messageReceived);
		} catch (e) {
			console.log(e);
			return;
		}
		switch (message.type) {
			case "offer":
				console.log("offer received");
				_handleOffer(message.offer);
				break;
			case "answer":
				console.log("answer received");
				_handleAnswer(message.answer);
				break;
			case "candidate":
				_handeCandidate(message.candidate);
				break;
			case "login":
				if (message.success) {
					let info = {
						type: "login",
						login: true
					};
					this.ConnectionInfo(info);
				} else {
					let info = {
						type: "login",
						login: false
					};
					this.ConnectionInfo(info);
				}
				break;
			default:
				console.log("messaggio non gestibile");
				break;
		}
		_handleOffer = offer => {
			ws = this.webSocketSignServer;
			this.peer
				.setRemoteDescription(new RTCSessionDescription(offer))
				.then(() => {
					return this.peer.createAnswer();
				})
				.then(description => {
					this.peer.setLocalDescription(description).then(() => {
						let data = {
							name: this.otherUsername,
							type: "answer",
							answer: this.peer.localDescription
						};
						ws.send(JSON.stringify(data));
					});
				})
				.catch(e => console.error(e));
		};
		_handleAnswer = answer => {
			this.peer.setRemoteDescription(new RTCSessionDescription(answer));
			let info = {
				type: "connected_answer"
			};
			this.ConnectionInfo(info);
		};
		_handeCandidate = candidate => {
			console.log("Ricevo ICE", candidate);
			if (candidate) {
				let newCandidate = new RTCIceCandidate(candidate);
				this.peer.addIceCandidate(newCandidate);
			}
		};
	}
	ConnectToServer(
		address = "ws://2.226.180.184:9090"
	) {
		return new Promise((resolve, reject) => {
			console.log(address);
			ws = this.webSocketSignServer = new WebSocket(address);
			ws.onopen = () => {
				let data = {
					name: this.username,
					type: "login"
				};
				ws.send(JSON.stringify(data)); // send a message
				resolve();
			};

			ws.onmessage = e => this._messageHandler(e.data);

			ws.onerror = e => {
				let info = {
					type: "WebSocket",
					message: e.message
				};
				this.ConnectionInfo(info);
				reject();
			};

			ws.onclose = e => {
				let info = {
					type: "WebSocket",
					message: e.message
				};
				this.ConnectionInfo(info);
			};
		});
	}
	SetupWebRTC(configuration, isOffer = false) {
		return new Promise((resolve, reject) => {
			const webRTCConfiguration = configuration.webRTCConfiguration;
			const dataChannelOptions = configuration.dataChannelOptions;
			const dataChannelName = configuration.channelName;
			const userMediaConfiguration = configuration.userMediaConfiguration;
			if (!(ws = this.webSocketSignServer)) {
				let info = {
					type: "WebSocket",
					message: "no connection"
				};
				this.ConnectionInfo(info);
				reject();
			}
			peer = this.peer = new RTCPeerConnection(webRTCConfiguration);
			dataChannel = this.dataChannel = peer.createDataChannel(
				dataChannelName,
				dataChannelOptions
			);
			dataChannel.onopen = () => {
				if (dataChannel.readyState === "open") {
					dataChannel.onmessage = message =>
						this.DataChannelMessage(message);
					console.log("Data channel open");
				}
			};
			dataChannel.ondatachannel = event => {
				dataChannel = event.dataChannel;
				dataChannel.onmessage = message =>
					this.DataChannelMessage(message);
				console.log("new data message");
			};
			peer.onicecandidate = event => {
				let data = {
					name: this.otherUsername,
					type: "candidate",
					candidate: event.candidate
				};
				ws.send(JSON.stringify(data));
			};
			peer.oniceconnectionstatechange = e => {
				let info = { type: "webrtc", message: "" };
				//i have putted foreach case a ConnectionInfo call because iceConnectionState includes others state. Fixme
				switch (peer.iceConnectionState) {
					case "connected":
						info.message = "connected";

						this.ConnectionInfo(info);
						break;
					case "disconnected":
						info.message = "disconnected";

						this.ConnectionInfo(info);
						break;
					case "failed":
						info.message = "failed";

						this.ConnectionInfo(info);
						break;
					case "closed":
						info.message = "closed";

						this.ConnectionInfo(info);
						break;
				}
			};
			/*peer.onnegotiationneeded = e => {
				if (isOffer) this.sendOffer();
			};*/
			peer.onaddstream = stream => {
				this.onaddstream(stream);
				this.stream = stream;
			};
			peer.onremovestream = ev => {
				this.onremovestream();
			};
			resolve();
		});
	}
	getUserMedia(audio, video) {
		return new Promise((resolve, reject) => {
			let isFront = true;

			mediaDevices
				.enumerateDevices()
				.then(sourceInfos => {
					let videoSourceId;
					for (let i = 0; i < sourceInfos.length; i++) {
						const sourceInfo = sourceInfos[i];
						if (
							sourceInfo.kind == "video" &&
							sourceInfo.facing == (isFront ? "front" : "back")
						) {
							videoSourceId = sourceInfo.id;
						}
					}
					return mediaDevices.getUserMedia({
						audio: audio,
						video: video && {
							mandatory: {
								minWidth: 500, // Provide your own width, height and frame rate here
								minHeight: 300,
								minFrameRate: 30
							},
							facingMode: isFront ? "user" : "environment",
							optional: videoSourceId
								? [{ sourceId: videoSourceId }]
								: []
						}
					});
				})
				.then(stream => {
					this.peer.addStream(stream);
					this.stream = stream;
					console.log("addo lo stream");
					resolve();
				})
				.catch(e => {
					console.error("Failed to setup stream:", e.message);
					reject();
				});
		});
	}
	sendOffer() {
		this.peer.createOffer().then(offer => {
			this.peer.setLocalDescription(offer);
			let data = {
				name: this.otherUsername,
				type: "offer",
				offer: offer
			};
			this.webSocketSignServer.send(JSON.stringify(data));
		});
	}
	disconnect(isController) {
		if (isController) {
			let data = {
				type: "disconnect"
			};
			this.dataChannel.send(JSON.stringify(data));

			setTimeout(() => {
				this.peer.close();
				this.webSocketSignServer.close();
			},3000);
		}
	}
}
