import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { COLORS } from './utils/theme';

import ScanScreen from './screens/ScanScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import ChatScreen from './screens/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.bgCard,
    border: COLORS.border,
    text: COLORS.textPrimary,
  },
};

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HistoryList" component={HistoryScreen} />
      <Stack.Screen name="HistoryResult" component={ResultScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer theme={MyTheme}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.textMuted,
              tabBarLabelStyle: styles.tabLabel,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: any = 'scan';
                if (route.name === 'ScanTab') iconName = focused ? 'scan' : 'scan-outline';
                if (route.name === 'HistoryTab') iconName = focused ? 'time' : 'time-outline';
                if (route.name === 'ChatTab') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                return <Ionicons name={iconName} size={22} color={color} />;
              },
            })}
          >
            <Tab.Screen name="ScanTab" component={ScanStack} options={{ title: 'Scan' }} />
            <Tab.Screen name="HistoryTab" component={HistoryStack} options={{ title: 'History' }} />
            <Tab.Screen name="ChatTab" component={ChatScreen} options={{ title: 'AI Chat' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});