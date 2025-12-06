import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PublicChat from '../components/PublicChat';
import { setActiveChat } from '../features/actions/chatActions';

const ChatPage = () => {
  const dispatch = useDispatch();
  
  const storeData = useSelector((state) => {
    return {
      activeChatId: state?.chat?.activeChatId,
    };
  });

  const { activeChatId } = storeData;

  useEffect(() => {
    // Set public chat as active
    if (!activeChatId) {
      dispatch(setActiveChat('public', 'public'));
    }
  }, [dispatch, activeChatId]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PublicChat />
    </div>
  );
};

export default ChatPage;
