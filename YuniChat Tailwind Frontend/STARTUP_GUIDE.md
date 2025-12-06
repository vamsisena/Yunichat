# YuniChat Tailwind Frontend - Setup & Run Guide

## ⚠️ CRITICAL: You MUST Follow These Steps

### Problem
The login is failing with 404 because the frontend dev server hasn't loaded the proxy configuration yet.

### Solution - Restart the Frontend Server

1. **Stop the current React dev server:**
   - Find the terminal running `npm start`
   - Press `Ctrl+C` to stop it

2. **Start the server fresh:**
   ```powershell
   cd "c:\Vamsi\React js\App\YuniChat\YuniChat Tailwind Frontend"
   npm start
   ```

3. **Wait for the server to fully start:**
   - You should see "webpack compiled successfully"
   - Application will open at http://localhost:3001

### Why This is Necessary

The `setupProxy.js` file that handles CORS and routes requests to the backend **only loads when the dev server starts**. Without restarting, the proxy won't work and you'll get:
- ❌ 404 errors on login
- ❌ WebSocket connection failures
- ❌ CORS errors

### After Restart - What Will Work

✅ **API Calls:**
- Frontend: `http://localhost:3001/api/auth/login`
- Proxy forwards to: `http://localhost:8080/api/auth/login`
- Backend responds successfully

✅ **WebSocket Connections:**
- Frontend: `ws://localhost:3001/ws/chat`
- Proxy upgrades to: `ws://localhost:8080/ws/chat`
- Real-time messaging works

✅ **No CORS Errors:**
- Browser sees all requests as same-origin (localhost:3001)
- No preflight OPTIONS failures

## Backend Status Check

Before testing, verify backend is running:

```powershell
cd "c:\Vamsi\React js\App\YuniChat\YuniChat Backend"
docker-compose ps
```

All services should show "Up":
- yunichat-gateway (port 8080)
- yunichat-auth-service (port 8081)
- yunichat-user-service (port 8082)
- yunichat-chat-service (port 8083)
- yunichat-file-service (port 8084)
- yunichat-notification-service (port 8085)
- postgres, redis, kafka, zookeeper

## Testing Your Application

### 1. Login Test
- **Username:** vamsis
- **Password:** (your password)
- **Expected:** Successful login, redirect to chat

### 2. Public Chat Test
- Send a message in the public room
- See your message appear
- See other users' messages

### 3. Private Chat Test
- Click on a user's avatar
- Click "Start Chat"
- Private chat window opens at bottom-right
- Send private messages
- Test minimize/maximize buttons

### 4. Voice Messages
- Click microphone icon
- Record a voice message
- Click send
- Voice player appears in chat

### 5. File Upload
- Click paperclip icon
- Select an image or file
- File uploads and displays

## Implemented Components

### ✅ Complete Components:
1. **PublicChat** - Main public chat room with WebSocket
2. **ChatWindow** - Message display with date separators
3. **MessageInput** - Text, file, emoji, voice input
4. **UserList** - User list with search and friend actions
5. **SingleChatWindow** - Private chat popup with minimize/maximize
6. **VoiceRecorder** - Voice message recording
7. **VoiceMessagePlayer** - Voice playback with controls
8. **UserActionPopup** - Quick actions for users
9. **UserProfilePopup** - User profile display
10. **TypingIndicator** - Animated typing dots
11. **MessageReactions** - Emoji reactions on messages
12. **ProfileMenu** - User profile menu
13. **Notifications** - Notifications dropdown
14. **Messages** - Messages dropdown

### Key Features Implemented:
- ✅ WebSocket real-time messaging
- ✅ Private chat windows
- ✅ Voice messages
- ✅ File uploads (images, documents)
- ✅ Emoji picker
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message reactions
- ✅ User presence (online/offline)
- ✅ Friend system
- ✅ Dark mode support
- ✅ Responsive design

## API Endpoints Configuration

All endpoints are configured to use the same backend as the MUI version:

### Authentication:
- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/guest-login`
- POST `/api/auth/logout`

### Users:
- GET `/api/users/search`
- GET `/api/users/friends`
- POST `/api/users/friend-request`

### Chat:
- GET `/api/chat/rooms/public/messages`
- GET `/api/chat/private/{userId}`
- POST `/api/chat/send`

### WebSocket:
- `/ws/chat` - Chat WebSocket endpoint
- `/topic/room/public` - Public chat topic
- `/user/queue/private` - Private messages

## Troubleshooting

### Still Getting 404 on Login?
1. Verify you restarted the dev server
2. Check browser console for the request URL
3. Should be `http://localhost:3001/api/auth/login` (NOT localhost:8080)
4. Check setupProxy.js exists in src/

### WebSocket Not Connecting?
1. Restart dev server (proxy must reload)
2. Check backend Gateway logs: `docker logs yunichat-gateway`
3. Verify backend is running: `docker-compose ps`

### CORS Errors Still Appearing?
1. Clear browser cache
2. Restart dev server
3. Check setupProxy.js configuration

## Development Notes

- **Port 3001:** Frontend (Tailwind version)
- **Port 3000:** Frontend (MUI version)
- **Port 8080:** Backend Gateway
- **Both frontends use the SAME backend and database**
- **User data is shared between both UI versions**

## Next Steps

After successful login:
1. Test all chat features
2. Test private messaging
3. Test voice messages
4. Test file uploads
5. Verify dark mode toggle works
6. Test on mobile viewport (responsive)
