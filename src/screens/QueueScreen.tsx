import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types/music';
import { useTheme, Theme } from '../theme';

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const QueueScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = getStyles(theme);

  const queue = usePlayerStore((state) => state.queue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const reorderQueue = usePlayerStore((state) => state.reorderQueue);
  const playFromQueue = usePlayerStore((state) => state.playFromQueue);

  const renderItem = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity style={styles.row} onPress={() => { playFromQueue(item); navigation.goBack(); }}>
      <Image source={{ uri: getUrl(item.image) }} style={styles.thumbnail} />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.name || item.title || 'Unknown'}</Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artists?.primary?.[0]?.name || 'Unknown Artist'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
          onPress={() => index > 0 && reorderQueue(index, index - 1)}
          disabled={index === 0}
        >
          <Ionicons name="chevron-up" size={18} color={index === 0 ? theme.textMuted : theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.arrowBtn, index === queue.length - 1 && styles.arrowBtnDisabled]}
          onPress={() => index < queue.length - 1 && reorderQueue(index, index + 1)}
          disabled={index === queue.length - 1}
        >
          <Ionicons name="chevron-down" size={18} color={index === queue.length - 1 ? theme.textMuted : theme.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromQueue(item.id)}>
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={28} color={theme.iconPrimary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Up Next</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Queue is empty.{'\n'}Swipe right on a search result to add songs.</Text>
        }
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  heading: { fontSize: 18, fontWeight: '700', color: theme.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  thumbnail: { width: 48, height: 48, borderRadius: 8, backgroundColor: theme.border },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 14, fontWeight: '600', color: theme.text },
  artist: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrowBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  arrowBtnDisabled: { opacity: 0.3 },
  deleteBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  emptyText: {
    textAlign: 'center',
    marginTop: 80,
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});

export default QueueScreen;
