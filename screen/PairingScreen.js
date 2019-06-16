import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
  Platform,
  AppState
} from "react-native";
import {
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes
} from "react-native-sensors";
import { WebRTC } from "../WebRTC";
import VIForegroundService from "@voximplant/react-native-foreground-service";

import RNExitApp from "react-native-exit-app";

setUpdateIntervalForType(SensorTypes.gyroscope, 100);

if (Platform.Version >= 26) {
  const channelConfig = {
    id: "channelId",
    name: "Channel name",
    description: "Channel description",
    enableVibration: false
  };
  VIForegroundService.createNotificationChannel(channelConfig);
}
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
  userMediaConfiguration: true, //true because we have to send stream to Controller
  isFront: true
};

export default class PairingScreen extends React.Component {
  state = {
    info: "Pairing",
    ActivityIndicatorIsVisible: true,
    reconnectButtonIsVisible: false,
    foregroundService: false
  };
  WebRTCConnection = null;
  _gyroscope = null;
  async startForegroundService() {
    const notificationConfig = {
      channelId: "channelId",
      id: 3456,
      title: "Title",
      text: "Some text",
      icon: "ic_icon"
    };
    try {
      await VIForegroundService.startService(notificationConfig);
    } catch (e) {
      console.error(e);
    }
  }
  looping = null;
  componentDidMount() {
    this.setState({ ActivityIndicatorIsVisible: true });
    const username = this.props.navigation.getParam("username");
    const otherUsername = this.props.navigation.getParam("otherUsername");
    const sigServer = this.props.navigation.getParam("sigServer");
    WebRTCConnection = this.WebRTCConnection = new WebRTC(
      username,
      otherUsername,
      sigServer
    );

    WebRTCConnection.ConnectionInfo = info => this._ConnectionInfoManager(info);
    WebRTCConnection.DataChannelMessage = message => {
      this._DataChannelManager(JSON.parse(message.data));
    };
    WebRTCConnection.ConnectToServer()
      .catch(() => {})
      .then(() => {
        return WebRTCConnection.SetupWebRTC(configurationWebRTC, true);
      });
  }
  disconnect() {
    this.WebRTCConnection.ConnectionInfo = () => {};
    this.WebRTCConnection.DataChannelMessage = () => {};
    this.WebRTCConnection.disconnect(false);
    clearInterval(this.looping);
    VIForegroundService.stopService();
    if (AppState.currentState == "background") RNExitApp.exitApp();
    this.props.navigation.navigate("Welcome");
  }

  render() {
    const _ActivityIndicator = () => {
      if (this.state.ActivityIndicatorIsVisible)
        return <ActivityIndicator size="large" color="white" />;
    };
    return (
      <View style={styles.container}>
        <Text style={{ color: "white", fontSize: 18 }}>{this.state.info}</Text>
        {_ActivityIndicator()}
        {this.state.reconnectButtonIsVisible && (
          <Button
            title="Try to reconnect"
            onPress={() =>
              this.setState({ reconnectButtonIsVisible: false }, () => {
                this.componentDidMount();
              })
            }
            color="red"
          />
        )}
        {this.state.foregroundService && (
          <Button
            title="Go to foreground"
            onPress={() => this.startForegroundService()}
          />
        )}
      </View>
    );
  }
  _ConnectionInfoManager(info) {
    switch (info.type) {
      case "WebSocket":
        this.setState({
          info:
            "Connection problem with server. Plese check your internet connection and try to reconnect.",
          reconnectButtonIsVisible: true,
          ActivityIndicatorIsVisible: false
        });
        break;
      case "login":
        if (info.login) {
          this.WebRTCConnection.sendOffer();
        } else
          this.setState({
            info:
              "There is a problem. Please generate another QRCode from Controller device and restart the Targed app.",
            reconnectButtonIsVisible: false,
            ActivityIndicatorIsVisible: false
          });
        break;
      case "webrtc":
        if (info.message == "connected") {
          this.setState({
            ActivityIndicatorIsVisible: false,
            info: "Press Home Button"
          });
          this.startForegroundService();
        } else {
             this.disconnect();
        }
        break;
      default:
        console.log("Connection info:messaggio non gestibile");
        break;
    }
  }
  _DataChannelManager(message) {
    WebRTCConnection = this.WebRTCConnection;
    switch (message.type) {
      case "streaming":
        if (message.activate) {
          WebRTCConnection._closeStream();
          WebRTCConnection.getUserMedia(message.audio, message.video).then(() =>
            WebRTCConnection.sendOffer()
          );
        } else {
          WebRTCConnection._closeStream();
          WebRTCConnection.sendOffer();
        }
        break;
      case "gyroscope":
        if (message.activate)
          this._gyroscope = gyroscope.subscribe(({ x, y, z, timestamp }) => {
            let data = {
              type: "gyroscope",
              axis: { x: x, y: y, z: z }
            };
            WebRTCConnection.send(JSON.stringify(data));
            console.log("send");
          });
        else this._gyroscope.unsubscribe();
        break;
      case "position":
        if (message.activate) {
          this.watchID = navigator.geolocation.watchPosition(
            position => {
              let data = {
                type: "position",
                coords: position.coords
              };
              WebRTCConnection.send(JSON.stringify(data));
            },
            error => console.log(error),
            { enableHighAccuracy: true }
          );
        } else {
          navigator.geolocation.clearWatch(this.watchID);
          navigator.geolocation.stopObserving();
        }
        break;
      case "disconnect":
        this.disconnect();

        break;
      default:
        console.log("DataChannelMessage messaggio non gestibile");
        break;
    }
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
