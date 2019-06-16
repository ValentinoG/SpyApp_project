import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";

import MapView, { Marker } from "react-native-maps";
export default class Position extends React.Component {
	state = {
		latitudeDelta: 0.0043,
		longitudeDelta: 0.0034,
		initialLong: 0,
		initialLat: 0,
		latitude: 0,
		longitude: 0
	};
	componentWillMount() {
		this.getPosition();
	}
	getPosition() {
		this.props.WebRTCConnection.DataChannelMessage = message => {
			let data = JSON.parse(message.data);
			this.setState({
				initialLong: data.coords.longitude,
				initialLat: data.coords.latitude,
				initialRegionSetted: true,
				latitude: data.coords.latitude,
				longitude: data.coords.longitude
			});
		};

		let message = {
			type: "position",
			activate: true
		};
		this.props.WebRTCConnection.send(JSON.stringify(message));
	}
	goBack(){
		this.props.WebRTCConnection.DataChannelMessage = null;
		let message = {
			type: "position",
			activate: false
		};
		this.props.WebRTCConnection.send(JSON.stringify(message));
		this.props.closeOverlayCallback()
	}
	render() {
		return (
			<View style={styles.container}>
				<View style={StyleSheet.absoluteFillObject}>
					<MapView
						initialRegion={{
							longitude: this.state.initialLong,
							latitude: this.state.initialLat,
							latitudeDelta: this.state.latitudeDelta,
							longitudeDelta: this.state.longitudeDelta
						}}
						region={{
							latitude: this.state.latitude,
							longitude: this.state.longitude,
							latitudeDelta: this.state.latitudeDelta,
							longitudeDelta: this.state.longitudeDelta
						}}
						style={StyleSheet.absoluteFillObject}
					>
						<Marker
							title="target"
							coordinate={{
								latitude: this.state.latitude,
								longitude: this.state.longitude
							}}
						/>
					</MapView>
					<Button title="Go back" onPress={()=>this.goBack()} color="grey"/>
				</View>
			</View>
		);
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "black",
		alignItems: "center",
		justifyContent: "center"
	}
});
