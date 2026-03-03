import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import FullPlayerScreen from './src/screens/FullPlayerScreen';
import FavouritesScreen from './src/screens/FavouritesScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import MiniPlayer from './src/components/MiniPlayer';
import BottomBar, { BOTTOM_BAR_HEIGHT } from './src/components/BottomBar';

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
          <Stack.Screen name="Favourites" component={FavouritesScreen} />
          <Stack.Screen name="Album" component={AlbumScreen} />
        </Stack.Navigator>

        <MiniPlayer
          hidden={activeRoute === 'FullPlayer'}
          bottomOffset={activeRoute !== 'FullPlayer' ? BOTTOM_BAR_HEIGHT : 0}
          onOpenFullPlayer={() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('FullPlayer' as never);
            }
          }}
        />
        {activeRoute !== 'FullPlayer' && (
          <BottomBar
            activeRoute={activeRoute}
            onNavigate={(route) => {
              if (navigationRef.isReady()) {
                navigationRef.navigate(route as never);
              }
            }}
          />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}