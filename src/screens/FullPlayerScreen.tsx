import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  LayoutChangeEvent,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/usePlayerStore';

const getUrl = (resources?: { url?: string; link?: string }[]) => {
  const item = resources?.[resources.length - 1];
  return item?.url || item?.link || '';
};

const formatMs = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const FullPlayerScreen = () => {
  const navigation = useNavigation();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const soundObj = usePlayerStore((state) => state.soundObj);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);

  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);
  const [trackWidth, setTrackWidth] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const dragStartRatioRef = useRef(0);
  const dragRatioRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const syncStatus = async () => {
      if (isScrubbing) return;
      if (!soundObj) return;
      const status = await soundObj.getStatusAsync();
      if (!mounted || !status.isLoaded) return;
      setPositionMillis(status.positionMillis ?? 0);
      setDurationMillis(status.durationMillis ?? 1);
    };

    syncStatus();
    timer = setInterval(syncStatus, 500);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [soundObj, isScrubbing]);

  const progressRatio = useMemo(() => {
    if (!durationMillis) return 0;
    return Math.min(1, Math.max(0, positionMillis / durationMillis));
  }, [positionMillis, durationMillis]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
  };

  const seekToRatio = async (ratio: number) => {
    if (!soundObj) return;
    const next = Math.floor(Math.min(1, Math.max(0, ratio)) * durationMillis);
    await soundObj.setPositionAsync(next);
    setPositionMillis(next);
  };

  const seekBy = async (deltaMs: number) => {
    if (!soundObj) return;
    const next = Math.max(0, Math.min(durationMillis, positionMillis + deltaMs));
    await soundObj.setPositionAsync(next);
    setPositionMillis(next);
  };

  const thumbLeft = useMemo(() => {
    const rawLeft = progressRatio * trackWidth - 9;
    return Math.max(0, Math.min(trackWidth - 18, rawLeft));
  }, [progressRatio, trackWidth]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setIsScrubbing(true);
          dragStartRatioRef.current = progressRatio;
          dragRatioRef.current = progressRatio;
        },
        onPanResponderMove: (_, gestureState) => {
          const ratio = Math.max(0, Math.min(1, dragStartRatioRef.current + gestureState.dx / trackWidth));
          dragRatioRef.current = ratio;
          setPositionMillis(Math.floor(ratio * durationMillis));
        },
        onPanResponderRelease: async () => {
          const ratio = dragRatioRef.current;
          setIsScrubbing(false);
          await seekToRatio(ratio);
        },
        onPanResponderTerminate: async () => {
          const ratio = dragRatioRef.current;
          setIsScrubbing(false);
          await seekToRatio(ratio);
        },
      }),
    [durationMillis, progressRatio, trackWidth]
  );

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.emptyText}>No song selected</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: getUrl(currentSong.image) }} style={styles.cover} />

      <Text style={styles.title} numberOfLines={1}>
        {currentSong.name || currentSong.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {currentSong.artists?.primary?.map((item) => item.name).join(', ') || 'Unknown Artist'}
      </Text>

      <Pressable
        style={styles.progressTrack}
        onLayout={onTrackLayout}
        onPress={(event) => seekToRatio(event.nativeEvent.locationX / trackWidth)}
      >
        <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
        <View
          style={[styles.seekThumb, { left: thumbLeft }]}
          {...panResponder.panHandlers}
        />
      </Pressable>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatMs(positionMillis)}</Text>
        <Text style={styles.timeText}>{formatMs(durationMillis)}</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.seekButton} onPress={() => seekBy(-10000)}>
          <Text style={styles.seekText}>-10</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Text style={styles.playText}>{isPlaying ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.seekButton} onPress={() => seekBy(10000)}>
          <Text style={styles.seekText}>+10</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  header: {
    height: 56,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#111',
    fontWeight: '600',
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: '#DDD',
    marginTop: 12,
  },
  title: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: '#111',
  },
  artist: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 18,
    color: '#555',
  },
  progressTrack: {
    marginTop: 28,
    height: 10,
    backgroundColor: '#DDD',
    borderRadius: 8,
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF982D',
  },
  seekThumb: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF982D',
  },
  timeRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  controlsRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  seekButton: {
    width: 72,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF982D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFF',
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyText: {
    marginTop: 24,
    fontSize: 18,
    color: '#444',
  },
});

export default FullPlayerScreen;
