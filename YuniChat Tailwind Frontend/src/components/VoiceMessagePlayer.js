import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

const VoiceMessagePlayer = ({ voiceUrl, duration }) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioDuration = duration || audioRef.current?.duration || 0;

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg min-w-[200px]">
      <button
        onClick={togglePlay}
        className="p-2 bg-primary-500 hover:bg-primary-600 rounded-full flex-shrink-0"
      >
        {playing ? (
          <PauseIcon className="w-4 h-4 text-white" />
        ) : (
          <PlayIcon className="w-4 h-4 text-white" />
        )}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-100"
            style={{ width: `${(currentTime / audioDuration) * 100}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
        {formatTime(currentTime)} / {formatTime(audioDuration)}
      </span>
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />
    </div>
  );
};

export default VoiceMessagePlayer;
