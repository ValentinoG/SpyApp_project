import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {createSwitchNavigator, createDrawerNavigator} from 'react-navigation'

import WelcomeScreen from './screen/WelcomeScreen'
import QRScanningScreen from './screen/QRScanningScreen'
import QRGeneratorScreen from './screen/QRGeneratorScreen'
import PairingScreen from './screen/PairingScreen'
import MainAppScreen from './screen/MainAppScreen'


const mainSwitchNavigator = createSwitchNavigator({
  Welcome:WelcomeScreen,
  QRScanning: QRScanningScreen,
  QRGenerator: QRGeneratorScreen,
  Pairing: PairingScreen,
  MainApp: MainAppScreen
})

export default mainSwitchNavigator;