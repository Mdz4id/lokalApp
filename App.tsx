import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import FullPlayerScreen from './src/screens/FullPlayerScreen';
import MiniPlayer from './src/components/MiniPlayer';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
  const [activeRoute, setActiveRoute] = React.useState<string>('Home');

  const syncActiveRoute = () => {
    const route = navigationRef.getCurrentRoute();
    if (route?.name) {
      setActiveRoute(route.name);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={syncActiveRoute}
        onStateChange={syncActiveRoute}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* These names must match what you use in navigation.navigate() */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="FullPlayer" component={FullPlayerScreen} />
        </Stack.Navigator>

        <MiniPlayer
          hidden={activeRoute === 'FullPlayer'}
          onOpenFullPlayer={() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('FullPlayer' as never);
            }
          }}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}