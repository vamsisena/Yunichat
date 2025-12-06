import React from 'react';
import { useSelector } from 'react-redux';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const WebSocketStatus = () => {
  const storeData = useSelector((state) => ({
    chatWsConnected: state?.websocket?.chatConnected || false,
  }));

  const { chatWsConnected } = storeData;

  return (
    <div className="flex items-center gap-2">
      {chatWsConnected ? (
        <>
          <WifiIcon className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-500">Connected</span>
        </>
      ) : (
        <>
          <SignalSlashIcon className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-500">Disconnected</span>
        </>
      )}
    </div>
  );
};

export default WebSocketStatus;
