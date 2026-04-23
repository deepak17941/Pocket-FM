// TrackPlayer playback service — handles lock-screen / notification remote commands.
// Must use `export default` (not `module.exports`) because this file has ES imports.
import TrackPlayer, { Event } from 'react-native-track-player';

const playbackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext().catch(() => {}));
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious().catch(() => {}));
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async ({ interval }) => {
    const pos = await TrackPlayer.getPosition();
    TrackPlayer.seekTo(pos + (interval ?? 15));
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async ({ interval }) => {
    const pos = await TrackPlayer.getPosition();
    TrackPlayer.seekTo(Math.max(0, pos - (interval ?? 15)));
  });
};

export default playbackService;
