import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useThemeStore } from '../store/useThemeStore';

const SettingsScreen = () => {
  const theme = useTheme();
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? theme.accent : '#f4f3f4'}
            trackColor={{ false: '#D1D1D1', true: theme.accent + '88' }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { padding: 20, paddingBottom: 8 },
    heading: { fontSize: 28, fontWeight: '700', color: theme.text },
    section: {
      marginTop: 16,
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    rowLabel: { fontSize: 16, color: theme.text },
  });

export default SettingsScreen;
