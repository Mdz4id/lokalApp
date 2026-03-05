import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export const BOTTOM_BAR_HEIGHT = 60;

type TabConfig = {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { route: 'Home',       label: 'Home',       icon: 'home-outline',      activeIcon: 'home' },
  { route: 'Search',     label: 'Search',     icon: 'search-outline',    activeIcon: 'search' },
  { route: 'Favourites', label: 'Favourites', icon: 'heart-outline',     activeIcon: 'heart' },
  { route: 'Settings',   label: 'Settings',   icon: 'settings-outline',  activeIcon: 'settings' },
];

// Receives standard BottomTabBarProps from the Tab navigator —
// no more manual activeRoute/onNavigate props needed.
const BottomBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = getStyles(theme);

  const activeRoute = state.routes[state.index].name;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? theme.accent : theme.tabInactive}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT + 20,
    backgroundColor: theme.tabBar,
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: theme.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    color: theme.tabInactive,
    fontWeight: '500',
  },
  labelActive: {
    color: theme.accent,
    fontWeight: '700',
  },
});

export default BottomBar;
