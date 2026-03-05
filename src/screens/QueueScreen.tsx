import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  PanResponder, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types/music';
import { useTheme, Theme } from '../theme';

const ROW_HEIGHT = 68;

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const QueueScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = getStyles(theme);

  const queue = usePlayerStore((s) => s.queue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const playFromQueue = usePlayerStore((s) => s.playFromQueue);

  // Auto-play first song if nothing is currently playing
  useEffect(() => {
    if (!currentSong && queue.length > 0) {
      playFromQueue(queue[0]);
    }
  }, []);

  // Local display order — mirrors queue but reorders live during drag
  const [displayQueue, setDisplayQueue] = useState<Song[]>([...queue]);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragSrcRef = useRef<number | null>(null);  // original queue index
  const dragCurRef = useRef<number | null>(null);  // current hover queue index

  // Sync display when store queue changes (only when not dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setDisplayQueue([...queue]);
    }
  }, [queue]);

  // Each PanResponder captures its original queue index at creation
  const makePR = (srcIndex: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        dragSrcRef.current = srcIndex;
        dragCurRef.current = srcIndex;
        setIsDragging(true);
        // Snapshot fresh copy of queue as drag baseline
        setDisplayQueue([...queue]);
      },
      onPanResponderMove: (_, gs) => {
        const newIdx = Math.max(
          0,
          Math.min(queue.length - 1, Math.round(srcIndex + gs.dy / ROW_HEIGHT))
        );
        if (newIdx !== dragCurRef.current) {
          dragCurRef.current = newIdx;
          // Rearrange display for live feedback
          const reordered = [...queue];
          const [moved] = reordered.splice(srcIndex, 1);
          reordered.splice(newIdx, 0, moved);
          setDisplayQueue(reordered);
        }
      },
      onPanResponderRelease: () => {
        const finalIdx = dragCurRef.current;
        isDraggingRef.current = false;
        dragSrcRef.current = null;
        dragCurRef.current = null;
        setIsDragging(false);
        if (finalIdx !== null && finalIdx !== srcIndex) {
          reorderQueue(srcIndex, finalIdx);
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        dragSrcRef.current = null;
        dragCurRef.current = null;
        setIsDragging(false);
        setDisplayQueue([...queue]);
      },
    });

  // Recreate PanResponders only when queue identity changes (not during drag)
  const panResponders = useMemo(
    () => queue.map((_, i) => makePR(i)),
    [queue],
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

      <ScrollView
        scrollEnabled={!isDragging}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {displayQueue.length === 0 ? (
          <Text style={styles.emptyText}>
            Queue is empty.{'\n'}Swipe right on a search result to add songs.
          </Text>
        ) : (
          displayQueue.map((item) => {
            // Always use the PanResponder keyed to this song's original queue index
            const qIdx = queue.findIndex((s) => s.id === item.id);
            const pr = panResponders[qIdx] ?? panResponders[0];
            const isActive = isDragging && dragSrcRef.current === qIdx;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, isActive && styles.rowDragging]}
                onPress={() => { playFromQueue(item); navigation.goBack(); }}
                activeOpacity={0.75}
              >
                <Image
                  source={{ uri: getUrl(item.image) }}
                  style={styles.thumbnail}
                />

                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.name || item.title || 'Unknown'}
                  </Text>
                  <Text style={styles.artist} numberOfLines={1}>
                    {item.artists?.primary?.[0]?.name || 'Unknown Artist'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => removeFromQueue(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={18} color={theme.textMuted} />
                </TouchableOpacity>

                {/* Drag handle — PanResponder lives here */}
                <View style={styles.dragHandle} {...pr.panHandlers}>
                  <Ionicons
                    name="reorder-three-outline"
                    size={24}
                    color={isActive ? theme.accent : theme.textMuted}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  rowDragging: {
    backgroundColor: theme.surface,
    opacity: 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: theme.border,
  },
  info: { flex: 1, marginLeft: 12 },
  title: { fontSize: 14, fontWeight: '600', color: theme.text },
  artist: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
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
