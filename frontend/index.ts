// IMPORTANT: on iOS/Android, register the TrackPlayer service BEFORE expo-router/entry runs.
// On web, skip RNTP entirely (it has no web implementation).
import { Platform } from 'react-native';

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TrackPlayer = require('react-native-track-player').default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const playbackService = require('./src/audio/playbackService').default;
    TrackPlayer.registerPlaybackService(() => playbackService);
  } catch {
    // native module not linked — will be handled gracefully by PlayerContext
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('expo-router/entry');
