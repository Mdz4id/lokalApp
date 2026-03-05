import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import FullPlayerScreen from './src/screens/FullPlayerScreen';
import FavouritesScreen from './src/screens/FavouritesScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import ArtistScreen from './src/screens/ArtistScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import QueueScreen from './src/screens/QueueScreen';
import MiniPlayer from './src/components/MiniPlayer';
import BottomBar, { BOTTOM_BAR_HEIGHT } from './src/components/BottomBar';
import { useThemeStore } from './src/store/useThemeStore';
import { usePlayerStore } from './src/store/usePlayerStore';
import { RootStackParamList, TabParamList, HomeStackParamList, SearchStackParamList } from './src/types/navigation';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Re-export for screens that need it
export type { RootStackParamList, TabParamList, HomeStackParamList, SearchStackParamList } from './src/types/navigation';

/** Home tab has its own stack so Album can be pushed within the Home tab */
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Album" component={AlbumScreen} />
      <HomeStack.Screen name="Artist" component={ArtistScreen} />
    </HomeStack.Navigator>
  );
}

/** Search tab has its own stack so Playlist can be pushed within the Search tab */
function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchMain" component={SearchScreen} />
      <SearchStack.Screen name="Playlist" component={PlaylistScreen} />
    </SearchStack.Navigator>
  );
}

/** Main tab navigator — switching tabs never pushes onto the stack */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Search" component={SearchStackNavigator} />
      <Tab.Screen name="Favourites" component={FavouritesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [activeRoute, setActiveRoute] = React.useState<string>('HomeMain');
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const loadQueue = usePlayerStore((state) => state.loadQueue);

  React.useEffect(() => {
    loadTheme();
    loadQueue();
  }, []);

  const syncActiveRoute = () => {
    const route = navigationRef.getCurrentRoute();
    if (route?.name) {
      setActiveRoute(route.name);
    }
  };

  const isFullPlayer = activeRoute === 'FullPlayer';
  const isModal = activeRoute === 'FullPlayer' || activeRoute === 'Queue';

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={syncActiveRoute}
        onStateChange={syncActiveRoute}
      >
        {/*
         * Root stack only holds the Tab navigator + modal overlays.
         * FullPlayer and Queue are presented on top of everything,
         * which automatically hides the BottomBar (it lives inside MainTabs).
         */}
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen
            name="FullPlayer"
            component={FullPlayerScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen
            name="Queue"
            component={QueueScreen}
            options={{ presentation: 'modal' }}
          />
        </RootStack.Navigator>

        {/* MiniPlayer floats above everything except FullPlayer/Queue */}
        <MiniPlayer
          hidden={isModal}
          bottomOffset={isModal ? 0 : BOTTOM_BAR_HEIGHT}
          onOpenFullPlayer={() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate('FullPlayer');
            }
          }}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}