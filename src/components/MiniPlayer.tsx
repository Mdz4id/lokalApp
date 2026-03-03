import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

interface MiniPlayerProps {
  hidden?: boolean;
  onOpenFullPlayer: () => void;
}

const MiniPlayer = ({ hidden = false, onOpenFullPlayer }: MiniPlayerProps) => {
  const insets = useSafeAreaInsets();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);

  if (!currentSong || hidden) return null;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.infoTapArea}
          onPress={onOpenFullPlayer}
        >
          <Image source={{ uri: getUrl(currentSong.image) }} style={styles.artwork} />

          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.name || currentSong.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {currentSong.artists?.primary?.[0]?.name || 'Unknown Artist'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
        >
          <Text style={styles.playButtonText}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoTapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  meta: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  title: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  subtitle: {
    color: '#CFCFCF',
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
  },
  playButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default MiniPlayer;
