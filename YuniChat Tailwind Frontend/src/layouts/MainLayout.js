import React, { useEffect, useState, useRef } from 'react';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../features/actions/uiActions';
import useWebSocket from '../hooks/useWebSocket';
import useInactivityTimer from '../hooks/useInactivityTimer';
import { WS_URL } from '../utils/constants';
import ProfileMenu from '../components/ProfileMenu';
import Notifications from '../components/Notifications';
import Messages from '../components/Messages';
import UserList from '../components/UserList';
import SingleChatWindow from '../components/SingleChatWindow';
import AddFriendDialog from '../components/AddFriendDialog';
import { addMessage, setTypingStatus, updateMessageStatus } from '../features/actions/chatActions';
import { addNotification } from '../features/actions/notificationActions';
import { updateUserStatus, loadUsers } from '../features/actions/userActions';
import { updateFriendStatus, addFriendRequest, loadFriends } from '../features/actions/friendActions';
import { setChatConnected, setChatClient } from '../features/actions/websocketActions';
import useAuth from '../hooks/useAuth';
import { getAvatarBgColor, getAvatarColorHex } from '../utils/avatarUtils';
import { isUserMentioned } from '../components/MentionRenderer';
import store from '../app/store';

const MainLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Track processed message IDs to prevent duplicate signal processing
  const processedMessageIds = useRef(new Set());

  const storeData = useSelector((state) => {
    return {
      sidebarOpen: state?.ui?.sidebarOpen || false,
      unreadCount: state?.notifications?.unreadCount || 0,
      unreadMessageCount: state?.chat?.unreadMessageCount || 0,
      pendingFriendRequestsCount: state?.friends?.requests?.length || 0,
      activeChatUserId: state?.chat?.activeChatUserId || null,
      chatMinimized: state?.chat?.chatMinimized || false,
      isMobile: state?.ui?.isMobile || false,
    };
  });

  const users = useSelector((state) => state?.users?.users || []);
  const { sidebarOpen, unreadCount, unreadMessageCount, pendingFriendRequestsCount, activeChatUserId, chatMinimized, isMobile } = storeData;

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [messagesAnchorEl, setMessagesAnchorEl] = useState(null);

  // Enable inactivity timer
  useInactivityTimer(true);

  // Build WebSocket URL
  const wsUrl = user?.id && user?.username
    ? `${WS_URL}?userId=${user.id}&username=${encodeURIComponent(user.username)}&isGuest=${user.isGuest || false}`
    : null;

  // Chat WebSocket connection
  const { connected: chatConnected, stompClient: chatClient } = useWebSocket(
    wsUrl,
    (client) => {
      console.log('🔌 WebSocket CONNECTED - User context:', { userId: user?.id, username: user?.username, isGuest: user?.isGuest });
      dispatch(setChatConnected(true));
      dispatch(setChatClient(client));

      // Set user status to ONLINE
      if (user?.id) {
        import('../features/actions/userActions').then(module => {
          dispatch(module.updateMyStatus('online'));
        });
      }

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Subscribe to private messages
      if (user?.id) {
        if (!client.connected || !client.active) {
          console.error('❌ Cannot subscribe to private messages - client disconnected');
          return;
        }

        try {
          client.subscribe('/user/queue/messages', (message) => {
            try {
              const msgData = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;

              const normalizedMsg = {
                ...msgData,
                senderName: msgData.senderUsername || msgData.senderName,
                sender: {
                  id: msgData.senderId,
                  username: msgData.senderUsername || msgData.senderName,
                  ...(msgData.sender || {})
                },
                timestamp: msgData.createdAt || msgData.timestamp,
                mentionedUserIds: msgData.mentionedUserIds || []
              };

              console.log('📩 Private message:', { 
                content: normalizedMsg.content, 
                mentionedUserIds: normalizedMsg.mentionedUserIds,
                senderId: normalizedMsg.senderId,
                currentUserId: user.id
              });

              const otherUserId = normalizedMsg.senderId === user.id ? normalizedMsg.recipientId : normalizedMsg.senderId;
              const chatKeyUserId = normalizedMsg.recipientId === user.id ? normalizedMsg.senderId : normalizedMsg.recipientId;
              const isMyMessage = normalizedMsg.senderId === user.id;
              const isChatWindowOpen = activeChatUserId === otherUserId && !chatMinimized;

              dispatch(addMessage({
                ...normalizedMsg,
                chatKey: chatKeyUserId,
                read: isMyMessage || isChatWindowOpen,
              }));


            } catch (error) {
              console.error('Error processing private message:', error);
            }
          });
        } catch (error) {
          console.error('❌ Error creating private message subscriptions:', error);
        }
      }

      // Subscribe to typing status
      client.subscribe('/topic/typing', (status) => {
        dispatch(setTypingStatus(status.userId, status.isTyping));
      });

      // Subscribe to private chat typing indicators
      if (user?.id) {
        try {
          client.subscribe('/user/queue/typing', (message) => {
            try {
              const indicator = JSON.parse(message.body);
              dispatch({
                type: 'SET_TYPING_INDICATOR',
                payload: {
                  userId: indicator.userId,
                  username: indicator.username,
                  isTyping: indicator.isTyping
                }
              });
            } catch (error) {
              console.error('❌ Error parsing typing indicator:', error);
            }
          });
        } catch (error) {
          console.error('❌ Error subscribing to typing indicators:', error);
        }
      }

      // Subscribe to message status updates
      client.subscribe(`/user/${user.id}/queue/status`, (status) => {
        dispatch(updateMessageStatus(status.messageId, status.status));
      });

      // Subscribe to friend requests
      if (user?.id && !user.isGuest) {
        client.subscribe(`/user/${user.id}/queue/friend-requests`, (message) => {
          try {
            const friendRequest = JSON.parse(message.body);
            dispatch(addFriendRequest(friendRequest));

            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('New Friend Request', {
                body: `${friendRequest.senderUsername} sent you a friend request`,
                icon: '/logo192.png',
                tag: `friend-request-${friendRequest.id}`,
                requireInteraction: true
              });

              notification.onclick = () => {
                window.focus();
                navigate('/friends');
                notification.close();
              };
            }

            dispatch(addNotification({
              type: 'FRIEND_REQUEST',
              title: 'Friend Request',
              message: `${friendRequest.senderUsername} sent you a friend request`,
              userId: friendRequest.senderId,
              timestamp: new Date().toISOString(),
            }));
          } catch (error) {
            console.error('❌ Error processing friend request:', error);
          }
        });

        // Subscribe to friend request accepted notifications
        client.subscribe(`/user/${user.id}/queue/friend-request-accepted`, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('🎉 Friend request accepted:', data);
            
            // Reload friends list
            dispatch(loadFriends());
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('Friend Request Accepted', {
                body: `${data.username} accepted your friend request`,
                icon: '/logo192.png',
                tag: 'friend-request-accepted',
              });
              
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
            
            // Show in-app notification
            dispatch(addNotification({
              type: 'FRIEND_REQUEST_ACCEPTED',
              title: 'Friend Request Accepted',
              message: `${data.username} accepted your friend request`,
              userId: data.userId,
              timestamp: new Date().toISOString(),
            }));
          } catch (error) {
            console.error('❌ Error processing friend request acceptance:', error);
          }
        });

        // Subscribe to mention notifications
        // NOTE: Spring STOMP automatically routes /user/queue/mentions to the current user's session
        // Backend sends to /user/{userId}/queue/mentions, but client subscribes to /user/queue/mentions
        console.log(`✅ Subscribing to /user/queue/mentions for mention notifications (for user ${user.id})`);
        const mentionSubscription = client.subscribe(`/user/queue/mentions`, (message) => {
          try {
            console.log('📨 RAW mention notification received:', message);
            console.log('📨 Message body:', message.body);
            const mention = JSON.parse(message.body);
            console.log('👤 Mention notification parsed:', mention);
            
            // Format notification text with username
            const senderName = mention.senderUsername || 'Someone';
            const chatLocation = mention.chatType === 'PUBLIC' ? 'public chat' : 'private chat';
            const mentionText = `${senderName} mentioned you in ${chatLocation}`;
            
            console.log('📢 Creating mention notification:', mentionText);
            
            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('You were mentioned', {
                body: `${mentionText}: ${mention.content.substring(0, 100)}`,
                icon: '/logo192.png',
                tag: `mention-${mention.messageId}`,
                requireInteraction: true
              });

              notification.onclick = () => {
                window.focus();
                if (mention.chatType === 'PUBLIC') {
                  navigate('/chat');
                } else if (mention.senderId) {
                  dispatch({ type: 'SET_ACTIVE_CHAT_WINDOW', payload: mention.senderId });
                }
                notification.close();
              };
            }

            // Redux notification - this will increment the notification badge
            dispatch(addNotification({
              id: Date.now(),
              type: 'MENTION',
              title: 'You were mentioned',
              message: mentionText,
              content: mention.content,
              userId: mention.senderId,
              senderUsername: senderName,
              chatType: mention.chatType,
              timestamp: new Date().toISOString(),
              read: false,
              isRead: false
            }));
            
            console.log('✅ Mention notification added to Redux store');
          } catch (error) {
            console.error('❌ Error processing mention notification:', error, error.stack);
          }
        });
        
        console.log('✅ Mention subscription created:', mentionSubscription ? 'SUCCESS' : 'FAILED');
      }

      // Subscribe to user status updates
      client.subscribe('/topic/user-status', (message) => {
        try {
          const statusData = JSON.parse(message.body);
          const upperStatus = statusData.status ? statusData.status.toUpperCase() : statusData.status;

          dispatch(updateUserStatus(statusData.userId, upperStatus));
          dispatch(updateFriendStatus(statusData.userId, upperStatus));
          dispatch({ type: 'UPDATE_USER_STATUS_IN_ACTIVE', payload: { userId: statusData.userId, status: upperStatus } });
        } catch (error) {
          console.error('❌ Error parsing status update:', error);
        }
      });

      // Subscribe to active users updates
      client.subscribe('/topic/active-users', (message) => {
        try {
          const data = JSON.parse(message.body);
          if (data.type === 'ACTIVE_USERS' && data.users) {
            dispatch({ type: 'UPDATE_ACTIVE_USERS', payload: data.users });
            // Also update user statuses in the users list
            data.users.forEach(activeUser => {
              dispatch(updateUserStatus(activeUser.id, 'ONLINE'));
            });
          } else if (data.type === 'USER_DISCONNECTED' && data.userId) {
            dispatch({ type: 'REMOVE_USER_FROM_ACTIVE', payload: data.userId });
            dispatch(updateUserStatus(data.userId, 'OFFLINE'));
          }
        } catch (error) {
          console.error('Error parsing active users:', error);
        }
      });

      // Request active users list
      setTimeout(() => {
        if (client.connected) {
          client.publish({
            destination: '/app/chat.requestActiveUsers',
            body: JSON.stringify({}),
          });
        }
      }, 500);

      // Subscribe to user connection events
      client.subscribe('/topic/user.connected', (message) => {
        const userData = JSON.parse(message.body);
        dispatch(updateUserStatus(userData.userId, 'ONLINE'));
        dispatch(loadUsers());
      });

      client.subscribe('/topic/user.disconnected', (message) => {
        const userData = JSON.parse(message.body);
        dispatch(updateUserStatus(userData.userId, 'OFFLINE'));
        dispatch({ type: 'REMOVE_USER_FROM_ACTIVE', payload: userData.userId });
      });

      // Subscribe to call signals
      console.log('🔍 CALL SUBSCRIPTION CHECK:', {
        userId: user?.id,
        hasUser: !!user,
        clientConnected: client?.connected,
        clientActive: client?.active,
        timestamp: new Date().toISOString()
      });
      
      if (!user?.id) {
        console.error('❌ CRITICAL: Cannot subscribe to call signals - user.id is missing!', { user });
      } else {
        console.log('📞 SUBSCRIBING to call signals for user:', user.id);
        try {
          const subscription = client.subscribe('/user/queue/call-signal', (message) => {
            try {
              // Check for duplicate messages using message-id header
              const messageId = message.headers['message-id'];
              if (messageId && processedMessageIds.current.has(messageId)) {
                console.log('📵 Ignoring duplicate call signal with message-id:', messageId);
                return;
              }
              
              if (messageId) {
                processedMessageIds.current.add(messageId);
                // Clean up old message IDs (keep only last 100)
                if (processedMessageIds.current.size > 100) {
                  const idsArray = Array.from(processedMessageIds.current);
                  processedMessageIds.current = new Set(idsArray.slice(-100));
                }
              }
              
              const signal = JSON.parse(message.body);
              console.log('📞 ✅ CALL SIGNAL RECEIVED:', signal);
              console.log('📞 Signal details - Type:', signal.type, 'From:', signal.callerId, 'To:', signal.calleeId, 'Current user:', user.id);
              
              // Import call actions dynamically to avoid circular dependencies
              import('../features/actions/callActions').then((callActions) => {
              switch (signal.type) {
                case 'CALL_OFFER':
                  console.log('📞 Processing CALL_OFFER - dispatching receiveCallOffer');
                  dispatch(callActions.receiveCallOffer({
                    callerId: signal.callerId,
                    callerUsername: signal.callerUsername,
                    callType: signal.callType,
                    sdp: signal.sdp,
                  }));
                  break;

                case 'CALL_ANSWER':
                  console.log('📞 ========================================');
                  console.log('📞 CALL_ANSWER signal received by user:', user?.id, user?.username);
                  console.log('📞 Signal calleeId (should match caller):', signal.calleeId);
                  console.log('📞 Signal callerId (receiver who sent answer):', signal.callerId);
                  console.log('📞 This user should be the CALLER (who initiated the call)');
                  console.log('📞 Signal details:', { hasAnswer: !!signal.sdp, sdpLength: signal.sdp?.length });
                  
                  // CRITICAL: Only process CALL_ANSWER if we are the intended recipient (calleeId)
                  // The receiver sends CALL_ANSWER with calleeId = caller's ID
                  // So only the caller should process this
                  if (signal.calleeId && signal.calleeId !== user?.id) {
                    console.warn('⚠️ Ignoring CALL_ANSWER - not intended for this user');
                    console.warn('   This CALL_ANSWER is for user:', signal.calleeId, 'but I am:', user?.id);
                    console.log('📞 ========================================');
                    break;
                  }
                  
                  console.log('✅ Processing CALL_ANSWER - I am the intended caller');
                  console.log('📞 ========================================');
                  dispatch(callActions.receiveCallAnswer({ sdp: signal.sdp }));
                  break;

                case 'ICE_CANDIDATE':
                  dispatch(callActions.receiveICECandidate({ candidate: signal.candidate }));
                  break;

                case 'CALL_END':
                  dispatch(callActions.receiveCallEnd());
                  break;

                case 'CALL_REJECT':
                  dispatch(callActions.receiveCallReject());
                  break;

                case 'CALL_BUSY':
                  dispatch(callActions.receiveCallBusy());
                  break;

                default:
                  console.warn('Unknown call signal type:', signal.type);
              }
            });
          } catch (error) {
            console.error('❌ Error processing call signal:', error);
          }
        });
        console.log('📞 ✅ SUBSCRIPTION SUCCESSFUL:', { subscriptionId: subscription?.id });
      } catch (error) {
        console.error('❌ FAILED TO SUBSCRIBE to call signals:', error);
      }
      }
    },
    (error) => {
      console.error('WebSocket error:', error);
      dispatch(setChatConnected(false));
      
      // End active call if WebSocket disconnects
      const callState = store.getState().call;
      if (callState?.activeCall || callState?.incomingCall) {
        console.log('🔌 WebSocket disconnected during call - ending call');
        import('../features/actions/callActions').then(module => {
          if (callState.activeCall?.peerId) {
            dispatch(module.endCall({ peerId: callState.activeCall.peerId }));
          } else {
            // Just clear call state without sending signal
            dispatch({ type: 'call/clearCall' });
          }
        });
      }
    }
  );

  useEffect(() => {
    dispatch(setChatConnected(chatConnected));
  }, [chatConnected, dispatch]);

  useEffect(() => {
    if (chatClient) {
      dispatch(setChatClient(chatClient));
    }
  }, [chatClient, dispatch]);

  // Load users, friends, and notifications
  useEffect(() => {
    dispatch(loadUsers());
    if (user && !user.isGuest) {
      dispatch(loadFriends());
      // Load notifications on login
      import('../features/actions/notificationActions').then(module => {
        dispatch(module.loadNotifications());
      });
    }

    const timeout = setTimeout(() => {
      dispatch(loadUsers());
      if (user && !user.isGuest) {
        dispatch(loadFriends());
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [dispatch, user]);

  // Auto-sync periodically
  useEffect(() => {
    const syncInterval = setInterval(() => {
      dispatch(loadUsers());
      if (user && !user.isGuest) {
        dispatch(loadFriends());
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [dispatch, user]);

  // Listen for clearing old public messages
  useEffect(() => {
    const handleClearOldMessages = (event) => {
      dispatch({ type: 'CLEAR_OLD_PUBLIC_MESSAGES', payload: event.detail });
    };

    window.addEventListener('clearOldPublicMessages', handleClearOldMessages);
    return () => window.removeEventListener('clearOldPublicMessages', handleClearOldMessages);
  }, [dispatch]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
    setProfileMenuOpen(true);
  };

  const handleProfileClose = () => {
    setProfileMenuOpen(false);
    setProfileAnchorEl(null);
  };

  const handleNotificationsClick = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
    setNotificationsOpen(true);
  };

  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
    setNotificationsAnchorEl(null);
  };

  const handleMessagesClick = (event) => {
    setMessagesAnchorEl(event.currentTarget);
    setMessagesOpen(true);
  };

  const handleMessagesClose = () => {
    setMessagesOpen(false);
    setMessagesAnchorEl(null);
  };

  const handleAddFriendOpen = () => {
    setAddFriendOpen(true);
  };

  const handleAddFriendClose = () => {
    setAddFriendOpen(false);
  };

  const handleRefresh = () => {
    // Full page reload to refresh all data and clear any stuck states
    window.location.reload();
  };

  const avatarBgColor = getAvatarBgColor(user?.avatarUrl, user?.gender);
  const avatarHexColor = getAvatarColorHex(user?.gender);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 
              onClick={() => navigate('/chat')}
              className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              YuniChat
            </h1>
            {chatConnected && (
              <span className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Connected
              </span>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>

            {user && !user.isGuest && (
              <button
                onClick={handleAddFriendOpen}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Add Friend"
              >
                <UserPlusIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            <button
              onClick={handleMessagesClick}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Messages"
            >
              <ChatBubbleLeftIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {unreadMessageCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </button>

            <button
              onClick={handleNotificationsClick}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Notifications"
            >
              <BellIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={handleProfileClick}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Profile"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || user.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarBgColor || 'bg-gray-500'}`}
                  style={!avatarBgColor ? { backgroundColor: avatarHexColor } : {}}
                >
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {isMobile ? (
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 mt-16"
              onClick={handleToggleSidebar}
            />
          )}
          <aside
            className={`fixed left-0 top-16 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <UserList />
          </aside>
        </>
      ) : (
        <aside
          className={`fixed left-0 top-16 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <UserList />
        </aside>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 mt-16 transition-all duration-300 overflow-hidden ${
          sidebarOpen && !isMobile ? 'ml-72' : 'ml-0'
        }`}
      >
        {children}
      </main>

      {/* Profile Menu */}
      <ProfileMenu
        anchorEl={profileAnchorEl}
        open={profileMenuOpen}
        onClose={handleProfileClose}
      />

      {/* Messages */}
      <Messages
        anchorEl={messagesAnchorEl}
        open={messagesOpen}
        onClose={handleMessagesClose}
      />

      {/* Notifications */}
      <Notifications
        anchorEl={notificationsAnchorEl}
        open={notificationsOpen}
        onClose={handleNotificationsClose}
      />

      {/* Single Chat Window */}
      <SingleChatWindow />

      {/* Add Friend Dialog */}
      {user && !user.isGuest && (
        <AddFriendDialog open={addFriendOpen} onClose={handleAddFriendClose} />
      )}
    </div>
  );
};

export default MainLayout;
