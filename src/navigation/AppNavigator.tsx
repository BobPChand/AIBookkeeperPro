import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ScanScreen from '../screens/ScanScreen';
import TaxScreen from '../screens/TaxScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import AIChatAssistant from '../components/AIChatAssistant';

const Tab = createBottomTabNavigator();

const AIAssistantScreen: React.FC = () => {
  return (
    <View style={styles.screenContainer}>
      <AIChatAssistant />
    </View>
  );
};

const AppNavigator: React.FC = () => {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Transactions':
                iconName = focused ? 'list' : 'list-outline';
                break;
              case 'Scan':
                iconName = focused ? 'scan' : 'scan-outline';
                break;
              case 'Tax Center':
                iconName = focused ? 'calculator' : 'calculator-outline';
                break;
              case 'AI Assistant':
                iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                break;
              case 'Upgrade':
                iconName = focused ? 'star' : 'star-outline';
                break;
              default:
                iconName = 'home';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.neutral,
          tabBarStyle: {
            paddingBottom: 4,
            height: 56,
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={HomeScreen} options={{ title: 'Dashboard' }} />
        <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transactions' }} />
        <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
        <Tab.Screen name="Tax Center" component={TaxScreen} options={{ title: 'Tax Center' }} />
        <Tab.Screen name="AI Assistant" component={AIAssistantScreen} options={{ title: 'AI Assistant' }} />
        <Tab.Screen name="Upgrade" component={UpgradeScreen} options={{ title: 'Upgrade' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;
