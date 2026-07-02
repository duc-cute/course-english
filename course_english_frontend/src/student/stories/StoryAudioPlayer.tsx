import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { IconButton, Slider, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

type StoryAudioPlayerProps = {
  audioUrl: string;
  duration?: number;
  onTimeUpdate: (currentTime: number) => void;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StoryAudioPlayer({ audioUrl, duration, onTimeUpdate }: StoryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration ?? 0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
    setTotalDuration(duration ?? 0);
  }, [audioUrl, duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration && Number.isFinite(audio.duration)) {
      setTotalDuration(audio.duration);
    }
    onTimeUpdate(audio.currentTime);
  }, [onTimeUpdate]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [playing]);

  const handleSeek = useCallback(
    (_: Event, value: number | number[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      const next = Array.isArray(value) ? value[0] : value;
      audio.currentTime = next;
      setCurrentTime(next);
      onTimeUpdate(next);
    },
    [onTimeUpdate],
  );

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      if (prev >= 1.5) return 0.75;
      if (prev >= 1) return 1.5;
      return 1;
    });
  }, []);

  return (
    <div className="story-audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration) {
            setTotalDuration(audioRef.current.duration);
          }
        }}
      />
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
        <IconButton
          color="primary"
          onClick={() => void togglePlay()}
          aria-label={playing ? "Tạm dừng" : "Phát"}
          className="story-audio-player__play"
        >
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Typography variant="caption" className="story-audio-player__time">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </Typography>
        <Slider
          size="small"
          min={0}
          max={totalDuration || 1}
          step={0.05}
          value={Math.min(currentTime, totalDuration || 0)}
          onChange={handleSeek}
          sx={{ flex: 1, mx: 1 }}
        />
        <Typography
          component="button"
          type="button"
          variant="caption"
          className="story-audio-player__speed"
          onClick={cycleSpeed}
        >
          {speed}x
        </Typography>
      </Stack>
    </div>
  );
}
