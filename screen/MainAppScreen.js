import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { RTCView } from "react-native-webrtc";
import { Overlay } from "react-native-elements";
import Streaming from "../component/Streaming";
import Orientation from "../component/Orientation";
import Position from "../component/Position";

import { WebRTC } from "../WebRTC";
var configurationWebRTC = {
	webRTCConfiguration: {
		iceServers: [
			{ urls: "stun:stun.l.google.com:19302" },
			{
				url: "turn:numb.viagenie.ca",
				credential: "valentino",
				username: "valentinogandolfo@gmail.com"
			}
		],
		mandatory: { googlIPv6: false }
	},
	dataChannelOptions: {
		ordered: true, //no guaranteed delivery, unreliable but faster
		maxRetransmitTime: 1000 //milliseconds
	},
	channelName: "data",
	userMediaConfiguration: false,
	isFront: true
};

export default class MainAppScreen extends React.Component {
	state = {
		overlayStreamingIsVisible: false,
		overlayPositionIsVisible: false,
		overlayOrientationIsVisible: false,
		overlaySettingIsVisible: false,
		overlayDisconnectIsVisible: false,
		info: "Connected",
		disabledButton: false
	};
	looping = null;
	username = null;
	otherUsername = null;
	componentDidMount() {
		this.username = this.props.navigation.getParam("username");
		this.otherUsername = this.props.navigation.getParam("otherUsername");
		WebRTCConnection = this.WebRTCConnection = this.props.navigation.getParam(
			"webrtc"
		);
		WebRTCConnection.ConnectionInfo = info =>
			this._ConnectionInfoManager(info);
	}
	WebRTCConnection = null;
	disconnect() {
		WebRTCConnection.ConnectionInfo = () => {};
		this.WebRTCConnection.disconnect(true);
		this.props.navigation.navigate("Welcome");
	}
	render() {
		return (
			<View style={styles.container}>
				<Text style={{ color: "white", fontSize: 18 }}>
					Connection state: {this.state.info}
				</Text>
				<Button
					title="Streaming"
					onPress={() =>
						this.setState({ overlayStreamingIsVisible: true })
					}
					disabled={this.state.disabledButton}
					color="grey"
				/>

				<Button
					title="Position"
					onPress={() =>
						this.setState({ overlayPositionIsVisible: true })
					}
					disabled={this.state.disabledButton}
					color="grey"
				/>
				<Button
					title="Orientation"
					onPress={() =>
						this.setState({ overlayOrientationIsVisible: true })
					}
					disabled={this.state.disabledButton}
					color="grey"
				/>

				<Button
					title="Disconnect"
					onPress={() => {
						this.disconnect();
					}}
					disabled={this.state.disabledButton}
					color="grey"
				/>
				<Overlay
					isVisible={this.state.overlayStreamingIsVisible}
					fullScreen={true}
					overlayBackgroundColor="black"
				>
					<Streaming
						WebRTCConnection={this.WebRTCConnection}
						closeOverlayCallback={() =>
							this.setState({ overlayStreamingIsVisible: false })
						}
					/>
				</Overlay>
				<Overlay
					isVisible={this.state.overlayOrientationIsVisible}
					fullScreen={true}
					overlayBackgroundColor="black"
				>
					<Orientation
						closeOverlayCallback={() =>
							this.setState({
								overlayOrientationIsVisible: false
							})
						}
						WebRTCConnection={this.WebRTCConnection}
					/>
				</Overlay>
				<Overlay
					isVisible={this.state.overlayPositionIsVisible}
					fullScreen={true}
					overlayBackgroundColor="black"
				>
					<Position
						closeOverlayCallback={() =>
							this.setState({
								overlayPositionIsVisible: false
							})
						}
						WebRTCConnection={this.WebRTCConnection}
					/>
				</Overlay>
			</View>
		);
	}
	_ConnectionInfoManager(info) {
		WebRTCConnection = this.WebRTCConnection;
		switch (info.type) {
			case "WebSocket":
				this.setState({
					info:
						"Signaling server is crashed. Streaming will not work."
				});
				break;
			case "webrtc":
				if (info.message == "connected") {
					if (this.looping) clearInterval(this.looping);
					this.setState({ info: "Connected", disabledButton: false });
				} else
					this.setState({
						info: "Disconnected",
						disabledButton: true
					});
				/*WebRTCConnection.ConnectToServer()
				this.componentDidMount();*/
				break;
			default:
				this.setState({ info: info.message });
				break;
		}
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
		alignItems: "stretch",
		justifyContent: "space-evenly"
	}
});
