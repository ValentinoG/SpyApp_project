import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";

export default class Orientation extends React.Component {
	state = {
		axis: {
			x: 0,
			y: 0,
			z: 0
		}
	};
	componentWillMount() {
		this.props.WebRTCConnection.DataChannelMessage = message => {
			let data = JSON.parse(message.data);
			console.log("ricevuto");
			if (data.type == "gyroscope") {
				this.setState({ axis: data.axis });
				console.log(data.axis);
			}
		};
		let message = {
			type: "gyroscope",
			activate: true
		};
		this.props.WebRTCConnection.send(JSON.stringify(message));
	}
	goBack() {
		this.props.WebRTCConnection.DataChannelMessage = () => {};
		let message = {
			type: "gyroscope",
			activate: false
		};
		this.props.WebRTCConnection.send(JSON.stringify(message));
	}
	render() {
		return (
			<View style={styles.container}>
				<View style={{justifyContent:"center",alignItems:"center"}}>
				<Text style={{ color: "white", fontSize: 30 }}>
					x: {this.state.axis.x.toFixed(2)}
				</Text>
				<Text style={{ color: "white", fontSize: 30 }}>
					y: {this.state.axis.y.toFixed(2)}
				</Text>
				<Text style={{ color: "white", fontSize: 30 }}>
					z: {this.state.axis.z.toFixed(2)}
				</Text>
				</View>
				<Button
					title="Go Back"
					onPress={() => {
						this.goBack();
						this.props.closeOverlayCallback();
					}}
					color="grey"
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "black",
		alignItems: "stretch",
		justifyContent: "center"
	}
});
