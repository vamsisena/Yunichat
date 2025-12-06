import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

const VoiceRecorder = ({ onSendVoice, onCancel, disabled, autoStart }) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [autoStart]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSendVoice(audioBlob, duration);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    onCancel();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
      <div className="flex items-center gap-2 flex-1">
        <div className={`w-3 h-3 bg-red-500 rounded-full ${recording ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatDuration(duration)}
        </span>
        <MicrophoneIcon className="w-5 h-5 text-red-500" />
      </div>
      <button
        onClick={cancelRecording}
        disabled={disabled}
        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full disabled:opacity-50"
        title="Cancel"
      >
        <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={stopRecording}
        disabled={disabled || !recording}
        className="p-2 bg-primary-500 hover:bg-primary-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        title="Send"
      >
        <PaperAirplaneIcon className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default VoiceRecorder;
