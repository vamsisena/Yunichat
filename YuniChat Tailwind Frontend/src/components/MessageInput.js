import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { PaperAirplaneIcon, PaperClipIcon, FaceSmileIcon, MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { validateMessage } from '../utils/validators';
import useTyping from '../hooks/useTyping';
import fileApi from '../api/fileApi';
import VoiceRecorder from './VoiceRecorder';
import MentionInput from './MentionInput';
import { extractMentionedUserIds } from './MentionRenderer';

// Common emojis
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵', '🤯', '🤠', '🥳', '😎',
  '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
  '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
  '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
  '👍', '👎', '👏', '🙌', '👌', '🤝', '🙏', '💪', '❤️', '💔',
  '🔥', '✨', '⭐', '🎉', '🎊', '💯', '✅', '❌', '⚠️', '💬',
];

const MessageInput = ({ onSendMessage, onTyping, disabled = false, allowAttachments = true }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [voiceRecorderActive, setVoiceRecorderActive] = useState(false);
  const fileInputRef = useRef(null);
  const textFieldRef = useRef(null);

  // Get users for mention functionality
  const users = useSelector((state) => state?.users?.users || []);

  const { startTyping, stopTyping } = useTyping(
    (isTyping) => {
      console.log('💬 [MessageInput] useTyping callback fired:', isTyping);
      if (onTyping) {
        console.log('💬 [MessageInput] Calling onTyping callback');
        onTyping(isTyping);
      }
    },
    3000
  );

  const handleMessageChange = (value) => {
    console.log('⌨️ [MessageInput] handleMessageChange:', value.length, 'chars');
    setMessage(value);
    
    if (value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSendMessage = async () => {
    if (!validateMessage(message) && !selectedFile) return;
    
    setSending(true);
    stopTyping();
    
    try {
      const textContent = message.trim();
      
      // Extract mentioned user IDs from message text
      const mentionedUserIds = extractMentionedUserIds(textContent, users);
      
      if (selectedFile) {
        console.log('📤 Sending file with content:', textContent);
        console.log('👥 Mentioned users:', mentionedUserIds);
        await onSendMessage(textContent, { ...selectedFile, mentionedUserIds });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.log('👥 Mentioned users:', mentionedUserIds);
        await onSendMessage(textContent, null, mentionedUserIds);
      }
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const response = await fileApi.uploadFile(file, 'CHAT_FILE', (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('📤 Upload progress:', percentCompleted + '%');
      });

      console.log('📎 File upload response:', response);

      let fileUrl;
      if (response?.data?.data?.downloadUrl) {
        fileUrl = response.data.data.downloadUrl;
      } else if (response?.data?.data?.url) {
        fileUrl = response.data.data.url;
      } else if (response?.data?.downloadUrl) {
        fileUrl = response.data.downloadUrl;
      } else if (response?.data?.url) {
        fileUrl = response.data.url;
      }

      if (!fileUrl) {
        throw new Error('No file URL in response');
      }

      setSelectedFile({ fileUrl, fileName: file.name, type: 'FILE' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiClick = (e) => {
    setEmojiAnchor(e.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchor(null);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    handleEmojiClose();
    textFieldRef.current?.focus();
  };

  const handleSendVoice = async (audioBlob, duration) => {
    try {
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Invalid audio blob');
      }
      
      const voiceFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      console.log('🎤 Created voice file:', voiceFile.name);
      
      const response = await fileApi.uploadFile(voiceFile, 'CHAT_VOICE', (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('🎤 Voice upload progress:', percentCompleted + '%');
      });
      
      console.log('🎤 Voice upload response:', response);
      
      let voiceUrl;
      if (response?.data?.data?.downloadUrl) {
        voiceUrl = response.data.data.downloadUrl;
      } else if (response?.data?.data?.url) {
        voiceUrl = response.data.data.url;
      } else if (response?.data?.downloadUrl) {
        voiceUrl = response.data.downloadUrl;
      } else if (response?.data?.url) {
        voiceUrl = response.data.url;
      }
      
      if (!voiceUrl) {
        throw new Error('No voice URL in response');
      }
      
      await onSendMessage('', { 
        voiceUrl, 
        voiceDuration: duration, 
        type: 'VOICE',
        fileName: 'Voice Message',
      });
      console.log('🎤 Voice message sent successfully');
      setError('');
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send voice message';
      setError(errorMessage);
      throw error;
    }
  };

  return (
    <div className="px-4 pt-2 pb-2">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm">
            <span className="truncate max-w-[200px]">{selectedFile.fileName}</span>
            <button onClick={handleRemoveFile} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Voice Recorder */}
      {voiceRecorderActive ? (
        <VoiceRecorder 
          onSendVoice={async (audioBlob, duration) => {
            try {
              await handleSendVoice(audioBlob, duration);
              setVoiceRecorderActive(false);
            } catch (error) {
              console.error('Voice send failed');
            }
          }}
          onCancel={() => setVoiceRecorderActive(false)}
          disabled={disabled || sending || uploading}
          autoStart={true}
        />
      ) : (
        <div className="flex gap-1 items-end w-full">
          {/* Left side icons */}
          <div className="flex gap-1 items-center">
            {/* File Upload */}
            {allowAttachments && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <button
                  onClick={handleFileSelect}
                  disabled={disabled || sending || uploading}
                  className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Attach file"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperClipIcon className="w-5 h-5" />
                  )}
                </button>
              </>
            )}

            {/* Emoji Button */}
            <button
              onClick={handleEmojiClick}
              disabled={disabled || sending || uploading}
              className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Add emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Message Input with Mention Support */}
          <div className="flex-1 min-w-0">
            <MentionInput
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={disabled || sending || uploading}
              className="w-full px-4 py-3 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              excludeCurrentUser={true}
            />
          </div>

          {/* Right side icons */}
          <div className="flex gap-1 items-end">
            {/* Voice Record */}
            <button
              onClick={() => setVoiceRecorderActive(true)}
              disabled={disabled || sending || uploading}
              className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Record voice message"
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={(!validateMessage(message) && !selectedFile) || disabled || sending || uploading}
              className={`p-2 rounded-full flex-shrink-0 ${
                (validateMessage(message) || selectedFile) 
                  ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title="Send message"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {emojiAnchor && (
        <div className="fixed inset-0 z-[9999]" onClick={handleEmojiClose}>
          <div 
            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 max-w-[320px]"
            style={{
              bottom: '80px',
              left: emojiAnchor.getBoundingClientRect().left,
              transform: 'translateX(-50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-10 gap-1 max-h-[200px] overflow-y-auto">
              {EMOJI_LIST.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-2xl p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:bg-red-600 rounded p-0.5">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
