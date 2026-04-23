// IMPORTANT: register the TrackPlayer service BEFORE expo-router/entry runs.
// expo-router/entry calls AppRegistry.registerComponent internally; RNTP's
// registerPlaybackService must happen on the same JS tick as AppRegistry.
import TrackPlayer from 'react-native-track-player';
import playbackService from './src/audio/playbackService';

TrackPlayer.registerPlaybackService(() => playbackService);

// Now load the Expo Router entry (which registers the root React component).
import 'expo-router/entry';
