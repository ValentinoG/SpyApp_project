import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator
} from "react-native";
import QRCode from "react-native-qrcode";
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

export default class QRGeneratorScreen extends React.Component {
  state = {
    username: "",
    otherUsername: "",
    QRCodeText: [],
    successConnectToSignalingServer: 0 /* 0=waiting_for_response, 1=connecting_success, -1=failed_to_connect*/,
    messageError: "",
    stream: ""
  };
  WebRTCConnection = null;
  randomWordGenerator() {
    const WORD_LEN = 16;
    const esclusedChar = [47, 92]; // / and \
    const charMin = 41;
    const charMax = 127;
    let word = "";
    for (let i = 0; i < WORD_LEN; ) {
      let random = Math.floor(Math.random() * (charMax - charMin)) + charMin;
      if (random != esclusedChar[0] && random != esclusedChar[1]) {
        word += String.fromCharCode(random);
        i++;
      }
    }
    return word;
  }
  _ConnectionInfoManager(info) {
    switch (info.type) {
      case "WebSocket":
        this.setState({
          messageError: info.message,
          successConnectToSignalingServer: -1
        });
        break;
      case "login":
        if (info.login) this.setState({ successConnectToSignalingServer: 1 });
        else
          this.setState({
            messageError: "Plese, generate another QRCode",
            successConnectToSignalingServer: -1
          });
        break;
      case "webrtc":
        if (info.message == "connected") {
          this.props.navigation.navigate(
            "MainApp",
            {
              webrtc: this.WebRTCConnection,
              username: this.state.username,
              otherUsername: this.state.otherUsername
            }
          );
        } else {
          this.setState({
            messageError: "WebRTC error",
            successConnectToSignalingServer: -1
          });
        }
        break;
    }
  }
  componentWillMount() {
    const sigServer = this.props.navigation.getParam("sigServer");
    this.setState({ sigServer });
  }
  componentDidMount() {
    const sigServer = this.props.navigation.getParam("sigServer");
    const username = this.randomWordGenerator();
    const otherUsername = this.randomWordGenerator();
    let isConnected = false;
    let attemps = 0;
    WebRTCConnection = this.WebRTCConnection = new WebRTC(
      username,
      otherUsername,
      this.state.sigServer
    );
    console.log(username, otherUsername);
    WebRTCConnection.ConnectionInfo = info => this._ConnectionInfoManager(info);
    WebRTCConnection.ConnectToServer()
      .catch(error => {})
      .then(() => {
        WebRTCConnection.SetupWebRTC(configurationWebRTC);
        const QRCodeText = JSON.stringify([username, otherUsername]);
        this.setState({
          username,
          otherUsername,
          QRCodeText
        });
      });
  }
  render() {
    const _ActivityIndicator = () => {
      switch (this.state.successConnectToSignalingServer) {
        case -1:
          return (
            <View style={styles.reconnect}>
              <Text style={{ color: "red", textAlign: "center" }}>
                {this.state.messageError}
              </Text>
              <Button
                title="Try to reconnect"
                onPress={() =>
                  this.setState({ successConnectToSignalingServer: 0 }, () => {
                    this.componentDidMount();
                  })
                }
                color="red"
              />
            </View>
          );
        case 0:
          return <ActivityIndicator size="large" color="black" />;
        case 1:
          return (
            <View style={styles.qrView}>
              <QRCode
                value={this.state.QRCodeText}
                size={200}
                bgColor="black"
                fgColor="white"
              />
              <Text
                style={{ color: "black", fontSize: 18, textAlign: "center" }}
              >
                Please scan the QRCode above with the Target device
              </Text>
            </View>
          );
      }
    };
    return <View style={styles.container}>{_ActivityIndicator()}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "white"
  },
  qrView: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center"
  },
  reconnect: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
