# Vidstack + HLS.js Integration Patterns & Examples

> Source: https://vidstack.io/docs/player , https://github.com/video-dev/hls.js | @vidstack/react ^1.12.x, hls.js ^1.6.x

## Table of Contents

- [Basic HLS Video Player](#basic-hls-player)
- [Player with Subtitles and Chapters](#subtitles-chapters)
- [Custom HLS.js Configuration via Vidstack](#hls-config-vidstack)
- [Standalone HLS.js Usage](#standalone-hls)
- [Player with Custom UI (No Default Layout)](#custom-ui)
- [Player State Subscription](#state-subscription)
- [Programmatic Control via Refs](#programmatic-control)
- [Remote Control Pattern](#remote-control)
- [Autoplay with Fallback](#autoplay-fallback)
- [Custom Load Strategy](#custom-load)
- [Live Streaming](#live-streaming)
- [Quality Selection Menu](#quality-menu)
- [Audio Track Selection](#audio-track-selection)
- [Custom Gestures](#custom-gestures)
- [Player with Watermark Overlay](#watermark-overlay)
- [Multiple Source Formats](#multiple-sources)
- [Fullscreen & PiP Control](#fullscreen-pip)
- [YouTube/Vimeo Providers](#youtube-vimeo)
- [Custom Keyboard Shortcuts](#keyboard-shortcuts)
- [Error Handling Pattern](#error-handling)
- [HLS.js Custom Headers (Auth)](#hls-auth-headers)
- [HLS.js Quality Level Management](#hls-quality)
- [HLS.js Error Recovery](#hls-error-recovery)

---

## Basic HLS Video Player {#basic-hls-player}

```tsx
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from '@vidstack/react/player/layouts/default';

function HLSPlayer({ src, posterUrl }: { src: string; posterUrl?: string }) {
  return (
    <MediaPlayer
      src={src}              // e.g., "https://cdn.example.com/video.m3u8"
      viewType="video"
      streamType="on-demand"
      crossOrigin
      playsInline
      poster={posterUrl}
      posterLoad="eager"
      logLevel="warn"
    >
      <MediaProvider>
        <Poster className="vds-poster" />
      </MediaProvider>
      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        colorScheme="dark"
      />
    </MediaPlayer>
  );
}
```

---

## Player with Subtitles and Chapters {#subtitles-chapters}

```tsx
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from '@vidstack/react/player/layouts/default';

type SubtitleTrack = {
  url: string;
  label: string;
  srclang: string;
};

function PlayerWithSubs({
  src,
  subtitles,
}: {
  src: string;
  subtitles: SubtitleTrack[];
}) {
  const getSubtitleType = (url: string): 'srt' | 'vtt' => {
    return url.toLowerCase().split('?')[0].endsWith('.srt') ? 'srt' : 'vtt';
  };

  return (
    <MediaPlayer src={src} crossOrigin playsInline viewType="video" streamType="on-demand">
      <MediaProvider>
        <Poster className="vds-poster" />
        {subtitles.map((track) => (
          <Track
            key={track.srclang}
            src={track.url}
            kind="subtitles"
            label={track.label}
            lang={track.srclang}
            type={getSubtitleType(track.url)}
          />
        ))}
        {/* Chapter track for segment navigation */}
        <Track
          src="/chapters.vtt"
          kind="chapters"
          label="Chapters"
          lang="en"
          type="vtt"
          default
        />
      </MediaProvider>
      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        thumbnails="/thumbnails.vtt"  {/* Slider preview thumbnails */}
      />
    </MediaPlayer>
  );
}
```

---

## Custom HLS.js Configuration via Vidstack {#hls-config-vidstack}

Vidstack automatically manages hls.js. Access and configure via `onProviderSetup`:

```tsx
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import type { HLSProviderInstance } from '@vidstack/react';

function ConfiguredPlayer({ src, authToken }: { src: string; authToken: string }) {
  return (
    <MediaPlayer
      src={src}
      crossOrigin
      playsInline
      onProviderSetup={(provider) => {
        if (provider.type === 'hls') {
          const hlsProvider = provider as HLSProviderInstance;
          // Configure hls.js options
          hlsProvider.config = {
            maxBufferLength: 60,
            maxBufferSize: 120 * 1000 * 1000,
            capLevelToPlayerSize: true,
            lowLatencyMode: false,
            // Add auth headers to all requests
            xhrSetup: (xhr: XMLHttpRequest, url: string) => {
              xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            },
          };
        }
      }}
      onHlsManifestParsed={(detail) => {
        console.log(`Manifest parsed: ${detail.levels.length} quality levels`);
      }}
      onHlsError={(detail) => {
        if (detail.fatal) {
          console.error('Fatal HLS error:', detail.type, detail.details);
        }
      }}
    >
      <MediaProvider />
    </MediaPlayer>
  );
}
```

---

## Standalone HLS.js Usage {#standalone-hls}

When you need direct hls.js control outside Vidstack:

```tsx
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

function StandaloneHLSPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxBufferSize: 60 * 1000 * 1000,
        enableWorker: true,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        console.log(`${data.levels.length} quality levels`);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src;
    }
  }, [src]);

  return <video ref={videoRef} controls playsInline />;
}
```

---

## Player with Custom UI (No Default Layout) {#custom-ui}

```tsx
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Controls,
  PlayButton,
  MuteButton,
  FullscreenButton,
  TimeSlider,
  VolumeSlider,
  Time,
  Captions,
  Gesture,
} from '@vidstack/react';
import {
  PlayIcon,
  PauseIcon,
  MuteIcon,
  VolumeHighIcon,
  FullscreenIcon,
  FullscreenExitIcon,
} from '@vidstack/react/icons';

function CustomPlayer({ src }: { src: string }) {
  return (
    <MediaPlayer src={src} crossOrigin playsInline>
      <MediaProvider>
        <Poster className="vds-poster" />
      </MediaProvider>

      {/* Gestures */}
      <Gesture event="pointerup" action="toggle:paused" />
      <Gesture event="dblpointerup" action="toggle:fullscreen" />

      {/* Captions overlay */}
      <Captions />

      {/* Custom controls */}
      <Controls.Root>
        <Controls.Group>
          {/* Bottom controls */}
          <TimeSlider.Root>
            <TimeSlider.Track>
              <TimeSlider.TrackFill />
              <TimeSlider.Progress />
            </TimeSlider.Track>
            <TimeSlider.Thumb />
          </TimeSlider.Root>

          <PlayButton>
            <PlayIcon slot="play" />
            <PauseIcon slot="pause" />
          </PlayButton>

          <MuteButton>
            <MuteIcon slot="mute" />
            <VolumeHighIcon slot="volume-high" />
          </MuteButton>

          <VolumeSlider.Root>
            <VolumeSlider.Track>
              <VolumeSlider.TrackFill />
            </VolumeSlider.Track>
            <VolumeSlider.Thumb />
          </VolumeSlider.Root>

          <Time type="current" /> / <Time type="duration" />

          <FullscreenButton>
            <FullscreenIcon slot="enter" />
            <FullscreenExitIcon slot="exit" />
          </FullscreenButton>
        </Controls.Group>
      </Controls.Root>
    </MediaPlayer>
  );
}
```

---

## Player State Subscription {#state-subscription}

### Via useMediaState Hook (inside MediaPlayer children)

```tsx
import { useMediaState } from '@vidstack/react';

function PlayingStatus() {
  const playing = useMediaState('playing');
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const buffered = useMediaState('buffered');
  const quality = useMediaState('quality');

  return (
    <div>
      <p>Status: {playing ? 'Playing' : 'Paused'}</p>
      <p>Progress: {Math.round(currentTime)}s / {Math.round(duration)}s</p>
      {quality && <p>Quality: {quality.width}x{quality.height}</p>}
    </div>
  );
}
```

### Via useStore Hook (outside MediaPlayer or for multiple states)

```tsx
import { useRef } from 'react';
import { MediaPlayerInstance, useStore } from '@vidstack/react';

function ExternalStateReader() {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const { playing, currentTime, volume } = useStore(MediaPlayerInstance, playerRef);

  return (
    <div>
      <MediaPlayer ref={playerRef} src="...">
        <MediaProvider />
      </MediaPlayer>
      <p>Playing: {playing}, Time: {currentTime}, Volume: {volume}</p>
    </div>
  );
}
```

### Via subscribe (no re-renders)

```tsx
import { useRef, useEffect } from 'react';
import { MediaPlayerInstance } from '@vidstack/react';

function NoRerenderTracking() {
  const playerRef = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    return player.subscribe(({ currentTime, playing }) => {
      // This runs on every state change but does NOT trigger React re-render
      console.log('Time:', currentTime, 'Playing:', playing);
    });
  }, []);

  return (
    <MediaPlayer ref={playerRef} src="...">
      <MediaProvider />
    </MediaPlayer>
  );
}
```

---

## Programmatic Control via Refs {#programmatic-control}

```tsx
import { useRef } from 'react';
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from '@vidstack/react';

function ControlledPlayer() {
  const playerRef = useRef<MediaPlayerInstance>(null);

  const handlePlay = () => playerRef.current?.play();
  const handlePause = () => playerRef.current?.pause();
  const handleSeek = (time: number) => {
    if (playerRef.current) playerRef.current.currentTime = time;
  };
  const handleFullscreen = () => playerRef.current?.enterFullscreen();
  const handlePiP = () => playerRef.current?.enterPictureInPicture();

  return (
    <div>
      <MediaPlayer ref={playerRef} src="...">
        <MediaProvider />
      </MediaPlayer>
      <button onClick={handlePlay}>Play</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={() => handleSeek(30)}>Seek to 30s</button>
      <button onClick={handleFullscreen}>Fullscreen</button>
      <button onClick={handlePiP}>PiP</button>
    </div>
  );
}
```

---

## Remote Control Pattern {#remote-control}

```tsx
import { useMediaRemote } from '@vidstack/react';

function ExternalControls() {
  const remote = useMediaRemote();

  return (
    <div>
      <button onClick={() => remote.play()}>Play</button>
      <button onClick={() => remote.pause()}>Pause</button>
      <button onClick={() => remote.toggleMuted()}>Toggle Mute</button>
      <button onClick={() => remote.changeVolume(0.5)}>50% Volume</button>
      <button onClick={() => remote.seek(remote.getPlayer()?.currentTime! + 10)}>+10s</button>
      <button onClick={() => remote.toggleFullscreen()}>Fullscreen</button>
      <button onClick={() => remote.changeQuality(-1)}>Auto Quality</button>
      <button onClick={() => remote.changePlaybackRate(1.5)}>1.5x Speed</button>
      <button onClick={() => remote.toggleCaptions()}>Toggle Captions</button>
    </div>
  );
}
```

---

## Autoplay with Fallback {#autoplay-fallback}

```tsx
function AutoplayPlayer({ src }: { src: string }) {
  return (
    <MediaPlayer
      src={src}
      autoPlay
      muted          // IMPORTANT: muted autoplay is reliable across browsers
      playsInline
      onAutoPlayFail={(detail) => {
        console.warn('Autoplay failed:', detail);
        // Show a play button overlay or notification
      }}
      onPlaying={() => {
        console.log('Playback started');
      }}
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
```

---

## Custom Load Strategy {#custom-load}

```tsx
import { useRef } from 'react';
import { MediaPlayer, MediaProvider, type MediaPlayerInstance } from '@vidstack/react';

function LazyPlayer({ src }: { src: string }) {
  const playerRef = useRef<MediaPlayerInstance>(null);

  return (
    <div>
      <MediaPlayer ref={playerRef} src={src} load="custom" playsInline>
        <MediaProvider />
      </MediaPlayer>
      <button onClick={() => playerRef.current?.startLoading()}>
        Load Video
      </button>
    </div>
  );
}
```

Load strategies: `'eager'` (immediately), `'idle'` (after page load), `'visible'` (when in viewport, **default**), `'play'` (on play interaction), `'custom'` (manual via `startLoading()`).

---

## Live Streaming {#live-streaming}

```tsx
function LivePlayer({ src }: { src: string }) {
  return (
    <MediaPlayer
      src={src}
      streamType="live:dvr"     // or "live" for no DVR
      minLiveDVRWindow={60}     // min seekable seconds for DVR
      liveEdgeTolerance={10}    // seconds behind edge = "at edge"
      crossOrigin
      playsInline
      onProviderSetup={(provider) => {
        if (provider.type === 'hls') {
          provider.config = {
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 6,
            maxLiveSyncPlaybackRate: 1.5,
            lowLatencyMode: true,
          };
        }
      }}
    >
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
```

---

## Quality Selection Menu {#quality-menu}

```tsx
import { useVideoQualityOptions, Menu } from '@vidstack/react';

function QualityMenu() {
  const options = useVideoQualityOptions();

  return (
    <Menu.Root>
      <Menu.Button>Quality</Menu.Button>
      <Menu.Items>
        <Menu.RadioGroup
          value={options.selectedValue}
          onChange={(value) => {
            const option = options.find((o) => o.value === value);
            option?.select();
          }}
        >
          {options.map((option) => (
            <Menu.Radio key={option.value} value={option.value}>
              {option.label}
            </Menu.Radio>
          ))}
        </Menu.RadioGroup>
      </Menu.Items>
    </Menu.Root>
  );
}
```

---

## Audio Track Selection {#audio-track-selection}

```tsx
import { useAudioOptions, Menu } from '@vidstack/react';

function AudioMenu() {
  const options = useAudioOptions();

  if (options.length <= 1) return null;

  return (
    <Menu.Root>
      <Menu.Button>Audio</Menu.Button>
      <Menu.Items>
        <Menu.RadioGroup
          value={options.selectedValue}
          onChange={(value) => {
            const option = options.find((o) => o.value === value);
            option?.select();
          }}
        >
          {options.map((option) => (
            <Menu.Radio key={option.value} value={option.value}>
              {option.label}
            </Menu.Radio>
          ))}
        </Menu.RadioGroup>
      </Menu.Items>
    </Menu.Root>
  );
}
```

---

## Custom Gestures {#custom-gestures}

```tsx
import { Gesture } from '@vidstack/react';

function GestureLayer() {
  return (
    <>
      {/* Single tap to toggle play/pause */}
      <Gesture event="pointerup" action="toggle:paused" />
      {/* Double tap to toggle fullscreen */}
      <Gesture event="dblpointerup" action="toggle:fullscreen" />
      {/* Double tap left side to seek backward */}
      <Gesture event="dblpointerup" action="seek:-10" />
      {/* Double tap right side to seek forward */}
      <Gesture event="dblpointerup" action="seek:10" />
    </>
  );
}
```

Available actions: `toggle:paused`, `toggle:muted`, `toggle:fullscreen`, `toggle:pip`, `toggle:controls`, `seek:{seconds}` (positive/negative).

---

## Player with Watermark Overlay {#watermark-overlay}

Based on the Power Course project pattern:

```tsx
import { useState } from 'react';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

function PlayerWithWatermark({
  src,
  watermarkText,
  subtitles,
}: {
  src: string;
  watermarkText: string;
  subtitles: { url: string; label: string; srclang: string }[];
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  return (
    <MediaPlayer
      src={src}
      viewType="video"
      streamType="on-demand"
      crossOrigin
      playsInline
      logLevel="warn"
      onPlaying={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={() => setIsEnded(true)}
    >
      <MediaProvider>
        <Poster className="vds-poster" />
        {subtitles.map((track) => (
          <Track
            key={track.srclang}
            src={track.url}
            kind="subtitles"
            label={track.label}
            lang={track.srclang}
            type={track.url.endsWith('.srt') ? 'srt' : 'vtt'}
          />
        ))}
      </MediaProvider>

      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        colorScheme="dark"
        smallLayoutWhen={true}
      />

      {/* Watermark overlay - only visible during playback */}
      {isPlaying && !isEnded && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <span className="text-white/30 text-sm">{watermarkText}</span>
        </div>
      )}

      {/* End screen overlay */}
      {isEnded && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <span className="text-white">Video ended</span>
        </div>
      )}
    </MediaPlayer>
  );
}
```

---

## Multiple Source Formats {#multiple-sources}

```tsx
// String source (file extension auto-detected)
<MediaPlayer src="https://cdn.example.com/video.mp4" />

// HLS source
<MediaPlayer src="https://cdn.example.com/stream.m3u8" />

// Source without extension (type hint required)
<MediaPlayer src={{ src: "https://cdn.example.com/video", type: "video/mp4" }} />

// YouTube
<MediaPlayer src="youtube/_cMxraX_5RE" />
<MediaPlayer src="https://www.youtube.com/watch?v=_cMxraX_5RE" />

// Vimeo
<MediaPlayer src="vimeo/640499893" />
<MediaPlayer src="https://vimeo.com/640499893" />

// MediaStream (e.g., webcam)
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
<MediaPlayer src={{ src: stream, type: 'video/object' }} />
```

---

## Fullscreen & PiP Control {#fullscreen-pip}

```tsx
import { useRef } from 'react';
import { MediaPlayer, MediaProvider, type MediaPlayerInstance, useMediaState } from '@vidstack/react';

function FullscreenPiPExample() {
  const playerRef = useRef<MediaPlayerInstance>(null);

  return (
    <MediaPlayer
      ref={playerRef}
      src="..."
      fullscreenOrientation="landscape"  // lock to landscape in fullscreen
      onFullscreenChange={(isFullscreen) => {
        console.log('Fullscreen:', isFullscreen);
      }}
      onPictureInPictureChange={(isPiP) => {
        console.log('PiP:', isPiP);
      }}
    >
      <MediaProvider />
      <FullscreenPiPControls />
    </MediaPlayer>
  );
}

function FullscreenPiPControls() {
  const canFullscreen = useMediaState('canFullscreen');
  const isFullscreen = useMediaState('fullscreen');
  const canPiP = useMediaState('canPictureInPicture');
  const isPiP = useMediaState('pictureInPicture');

  const remote = useMediaRemote();

  return (
    <div>
      {canFullscreen && (
        <button onClick={() => remote.toggleFullscreen()}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      )}
      {canPiP && (
        <button onClick={() => remote.togglePictureInPicture()}>
          {isPiP ? 'Exit PiP' : 'PiP'}
        </button>
      )}
    </div>
  );
}
```

---

## YouTube/Vimeo Providers {#youtube-vimeo}

```tsx
// YouTube - privacy mode (no cookies) by default
<MediaPlayer src="youtube/_cMxraX_5RE" playsInline>
  <MediaProvider />
  <DefaultVideoLayout icons={defaultLayoutIcons} />
</MediaPlayer>

// Vimeo
<MediaPlayer src="vimeo/640499893" playsInline>
  <MediaProvider />
  <DefaultVideoLayout icons={defaultLayoutIcons} />
</MediaPlayer>

// Vimeo private video (with hash)
<MediaPlayer src="https://vimeo.com/640499893/hash123" playsInline>
  <MediaProvider />
  <DefaultVideoLayout icons={defaultLayoutIcons} />
</MediaPlayer>
```

Supported URL formats:
- YouTube: `youtube/{id}`, `https://youtube.com/watch?v={id}`, `https://youtu.be/{id}`, `https://youtube-nocookie.com/watch?v={id}`
- Vimeo: `vimeo/{id}`, `https://vimeo.com/{id}`, `https://player.vimeo.com/video/{id}`

---

## Custom Keyboard Shortcuts {#keyboard-shortcuts}

```tsx
<MediaPlayer
  src="..."
  keyTarget="player"  // or "document"
  keyShortcuts={{
    togglePaused: 'k Space',
    toggleMuted: 'm',
    toggleFullscreen: 'f',
    togglePictureInPicture: 'p',
    seekBackward: 'j ArrowLeft',
    seekForward: 'l ArrowRight',
    volumeUp: 'ArrowUp',
    volumeDown: 'ArrowDown',
  }}
>
  <MediaProvider />
</MediaPlayer>
```

Shortcut format: space-separated key combinations. Supports `Control+`, `Shift+`, `Alt+` modifiers.

---

## Error Handling Pattern {#error-handling}

```tsx
function RobustPlayer({ src }: { src: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}
      <MediaPlayer
        src={src}
        onError={(detail) => {
          setError(`Media error: ${detail.message}`);
        }}
        onHlsError={(detail) => {
          if (detail.fatal) {
            setError(`HLS error: ${detail.details}`);
          }
        }}
        onAutoPlayFail={() => {
          setError('Autoplay was blocked. Click to play.');
        }}
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
    </div>
  );
}
```

---

## HLS.js Custom Headers (Auth) {#hls-auth-headers}

```ts
const hls = new Hls({
  xhrSetup: (xhr: XMLHttpRequest, url: string) => {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('X-Custom-Header', 'value');
  },
});

// Or with fetch loader
const hls = new Hls({
  fetchSetup: (context, initParams) => {
    initParams.headers = {
      ...initParams.headers,
      Authorization: `Bearer ${token}`,
    };
    return new Request(context.url, initParams);
  },
});
```

---

## HLS.js Quality Level Management {#hls-quality}

```ts
// List all available qualities
hls.levels.forEach((level, index) => {
  console.log(`Level ${index}: ${level.width}x${level.height} @ ${level.bitrate}bps`);
});

// Set specific quality (immediate switch)
hls.currentLevel = 2;

// Set quality for next segment (smooth switch)
hls.nextLevel = 2;

// Enable auto quality selection
hls.currentLevel = -1;

// Cap quality to player size
hls.capLevelToPlayerSize = true;

// Listen for quality changes
hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
  const level = hls.levels[data.level];
  console.log(`Switched to: ${level.width}x${level.height}`);
});
```

---

## HLS.js Error Recovery {#hls-error-recovery}

```ts
let mediaErrorRecoveryAttempts = 0;

hls.on(Hls.Events.ERROR, (event, data) => {
  if (!data.fatal) return; // Non-fatal, hls.js handles automatically

  switch (data.type) {
    case Hls.ErrorTypes.NETWORK_ERROR:
      console.error('Network error, attempting recovery...');
      hls.startLoad(); // Retry loading
      break;

    case Hls.ErrorTypes.MEDIA_ERROR:
      console.error('Media error, attempting recovery...');
      if (mediaErrorRecoveryAttempts < 2) {
        hls.recoverMediaError();
        mediaErrorRecoveryAttempts++;
      } else {
        // Last resort: swap audio codec and retry
        hls.swapAudioCodec();
        hls.recoverMediaError();
        mediaErrorRecoveryAttempts = 0;
      }
      break;

    default:
      console.error('Unrecoverable error, destroying instance');
      hls.destroy();
      break;
  }
});
```
