import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { RTCView } from "react-native-webrtc";
export default class Streaming extends React.Component {
	state = {
		showVideo: false,
		showAudio: false,
		audioVideoButtonIsDisabled: false,
		audioButtonIsDisabled: false,
		videoButtonIsDisabled: false,
		stream: ""
	};
	componentDidMount() {
		this.props.WebRTCConnection.onaddstream = (
			stream //addstream
		) => this.setState({ stream: stream.stream.toURL() });
		this.props.WebRTCConnection.onremovestream = () => {
			console.log("stream removed, handle event");
		};
	}
	_OpenCloseStreaming(open, audio, video) {
		WebRTCConnection = this.props.WebRTCConnection;
		let data = {
			type: "streaming",
			activate: open,
			audio: audio,
			video: video
		};
		WebRTCConnection.send(JSON.stringify(data));
	}
	_showVideo() {
		this.setState({
			showVideo: true,
			showAudio: false,
			videoButtonIsDisabled: true,
			audioVideoButtonIsDisabled: false,
			audioButtonIsDisabled: false
		});
		this._OpenCloseStreaming(true, false, true);
	}
	_showAudio() {
		this.setState({
			showAudio: true,
			showVideo: false,
			videoButtonIsDisabled: false,
			audioVideoButtonIsDisabled: false,
			audioButtonIsDisabled: true
		});
		this._OpenCloseStreaming(true, true, false);
	}
	_showAudioVideo() {
		this.setState({
			showAudio: false,
			showVideo: true,
			videoButtonIsDisabled: false,
			audioVideoButtonIsDisabled: true,
			audioButtonIsDisabled: false
		});
		this._OpenCloseStreaming(true, true, true);
	}
	_closeStreaming() {
		this.props.WebRTCConnection.onaddstream = stream => {};
		this._OpenCloseStreaming(false, false, false);
		this.props.closeOverlayCallback();
	}
	render() {
		const _RTCView = () => {
			if (this.state.showVideo)
				return (
					<RTCView
						style={styles.rtcView}
						streamURL={this.state.stream}
					/>
				);
			else if (this.state.showAudio) {
				return <Text> Audio</Text>;
			} else return;
		};
		return (
			<View style={styles.container}>
				<View style={{ flex: 2,justifyContent:"center",alignItems:"center" }}>{_RTCView()}</View>
				<View
					style={{
						flex: 1,
						justifyContent:"space-evenly"
					}}
				>
					<Button
						title="Close streaming"
						onPress={() => this._closeStreaming()}
						color="grey"
					/>
					<Button
						title="Video"
						onPress={() => this._showVideo()}
						disabled={this.state.videoButtonIsDisabled}
						color="grey"
					/>
					<Button
						title="Audio"
						onPress={() => this._showAudio()}
						disabled={this.state.audioButtonIsDisabled}
						color="grey"
					/>
					<Button
						title="Audio/Video"
						onPress={() => this._showAudioVideo()}
						disabled={this.state.audioVideoButtonIsDisabled}
						color="grey"
					/>
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "black"
	},
	rtcView: {
		width: "80%",
		height: "80%"
	}
});
