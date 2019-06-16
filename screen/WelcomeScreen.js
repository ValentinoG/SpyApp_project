import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  PermissionsAndroid,
  TextInput,
  BackHandler,
  AppState
} from "react-native";
const arrayPermissions = [
  PermissionsAndroid.PERMISSIONS.CAMERA,
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
];
async function requestPermission(permission) {
  try {
    const granted = await PermissionsAndroid.request(permission);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You  have this permission");
    } else {
      console.log("You don't have this permission");
    }
  } catch (err) {
    console.warn(err);
  }
}

export default class WelcomeScreen extends React.Component {
  state = {
    sigServerAddress: "",
    currentState: "active"
  };
  componentWillMount() {
    arrayPermissions.forEach(permission => requestPermission(permission));
    this.setState({ currentState: AppState.currentState });
    if (
      this.state.currentState == "background" ||
      AppState.currentState == "background"
    )
      setInterval(() => {
        //this.closeApp();
        BackHandler.exitApp();
      }, 500);
  }
  closeApp = () => {
    BackHandler.exitApp();
  };
  render() {
    return (
      <View style={styles.container}>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 40, color: "white" }}>SpyApp</Text>
        </View>
        <Button
          title="I'm controller"
          onPress={() =>
            this.props.navigation.navigate("QRGenerator", {
              sigServer: this.state.sigServerAddress
            })
          }
          color="grey"
        />
        <Button
          title="I'm target"
          onPress={() =>
            this.props.navigation.navigate("QRScanning", {
              sigServer: this.state.sigServerAddress
            })
          }
          color="grey"
        />
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 15, color: "white" }}>
            SIGNALING SERVER ADDRESS
          </Text>
          <TextInput
            style={{
              height: 40,
              width: "100%",
              borderRadius: 30,
              borderWidth: 1,
              backgroundColor: "grey"
            }}
            onChangeText={sigServerAddress =>
              this.setState({ sigServerAddress })
            }
          />
        </View>
      </View>
    );
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
