import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// Root stack: contains the Tab navigator + modal screens (FullPlayer, Queue)
export type RootStackParamList = {
  Main: undefined;
  FullPlayer: undefined;
  Queue: undefined;
};

// Tab navigator screens
export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Favourites: undefined;
  Settings: undefined;
};

// Home tab's own nested stack (allows Album to sit inside the Home tab)
export type HomeStackParamList = {
  HomeMain: undefined;
  Album: { albumId: string };
  Artist: { artistId: string };
};

// Search tab's own nested stack (allows Playlist to be pushed within Search tab)
export type SearchStackParamList = {
  SearchMain: undefined;
  Playlist: { playlistId: string; playlistName?: string };
};

// Composite type for screens inside HomeStack — lets them navigate both
// within the Home stack and up to the tab navigator (e.g., to Search tab)
export type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;
