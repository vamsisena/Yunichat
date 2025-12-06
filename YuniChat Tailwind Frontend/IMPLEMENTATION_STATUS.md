# YuniChat Tailwind Frontend - Implementation Guide

## Project Status

### ✅ Completed
1. **Project Configuration**
   - package.json with Tailwind CSS dependencies (port 3001)
   - tailwind.config.js
   - postcss.config.js
   - index.css with Tailwind directives

2. **Core Files**
   - src/index.js
   - src/App.js
   - public/index.html
   - public/manifest.json

3. **Utilities**
   - avatarUtils.js (Tailwind classes)
   - constants.js
   - dateUtils.js
   - validators.js
   - websocketEvents.js
   - messageStorage.js

4. **Redux Store** (Copied from original)
   - app/store.js
   - features/ (all actions, reducers, actionTypes)
   - api/ (all API files)
   - hooks/ (useAuth, useWebSocket, etc.)

5. **Layouts**
   - MainLayout.js (Tailwind version)
   - AuthLayout.js (Tailwind version)

6. **Pages**
   - LandingPage.js (Tailwind version)

### 🔄 In Progress / Pending

The following files need to be created with Tailwind UI:

#### Pages (src/pages/)
- [ ] ChatPage.js
- [ ] FriendsPage.js
- [ ] LoginModal.js
- [ ] RegisterModal.js
- [ ] GuestLoginModal.js
- [ ] EmailVerificationModal.js
- [ ] ForgotPasswordModal.js
- [ ] ProfilePage.js

#### Components (src/components/)
- [ ] BottomNavBar.js ⭐ CRITICAL
- [ ] UserList.js ⭐ CRITICAL
- [ ] PublicChat.js ⭐ CRITICAL
- [ ] SingleChatWindow.js ⭐ CRITICAL
- [ ] MessageInput.js
- [ ] Messages.js
- [ ] ProfileMenu.js
- [ ] Notifications.js
- [ ] FriendList.js
- [ ] AddFriendDialog.js
- [ ] ChatWindow.js
- [ ] TypingIndicator.js
- [ ] MessageReactions.js
- [ ] MessageContextMenu.js
- [ ] VoiceRecorder.js
- [ ] VoiceMessagePlayer.js
- [ ] UserProfilePopup.js
- [ ] UserProfileSidebar.js
- [ ] ProfilePopup.js
- [ ] StatusSelector.js
- [ ] WebSocketStatus.js
- [ ] UserActionPopup.js
- [ ] FriendRequest.js
- [ ] FriendSearch.js
- [ ] OtpVerificationModal.js
- [ ] PrivateChatPopup.js

## Implementation Instructions

### Step 1: Install Dependencies
```powershell
cd "c:\Vamsi\React js\App\YuniChat\YuniChat Tailwind Frontend"
npm install
```

### Step 2: Key Changes from Material-UI to Tailwind

#### useSelector Pattern
**Material-UI (Old):**
```javascript
const { friends, friendRequests } = useSelector((state) => ({
  friends: state?.friends?.friends || [],
  friendRequests: state?.friends?.requests || [],
}));
```

**Tailwind (New):**
```javascript
const storeData = useSelector((state) => {
  return {
    friends: state?.friends?.friends || [],
    friendRequests: state?.friends?.requests || [],
  };
});
const { friends, friendRequests } = storeData;
```

#### Icon Library
- Material-UI Icons → Heroicons React
- Import from: `@heroicons/react/24/outline` or `@heroicons/react/24/solid`

#### Common Icon Mappings
- `MenuIcon` → `Bars3Icon`
- `NotificationsIcon` → `BellIcon`
- `AccountCircle` → `UserCircleIcon`
- `RefreshIcon` → `ArrowPathIcon`
- `MessageIcon` → `ChatBubbleLeftIcon`
- `PersonAddIcon` → `UserPlusIcon`
- `CloseIcon` → `XMarkIcon`
- `SendIcon` → `PaperAirplaneIcon`
- `AttachFileIcon` → `PaperClipIcon`
- `MicIcon` → `MicrophoneIcon`
- `MoreVertIcon` → `EllipsisVerticalIcon`
- `CheckIcon` → `CheckIcon`
- `DeleteIcon` → `TrashIcon`
- `EditIcon` → `PencilIcon`

#### Common CSS Mappings
- `<Box>` → `<div className="...">`
- `<Paper>` → `<div className="card">`
- `<Button variant="contained">` → `<button className="btn-primary">`
- `<Button variant="outlined">` → `<button className="btn-secondary">`
- `<TextField>` → `<input className="input-field">`
- `<IconButton>` → `<button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">`
- `<Avatar>` → `<div className="rounded-full">`or `<img className="rounded-full">`
- `<Badge>` → Custom div with absolute positioning
- `<Drawer>` → Tailwind slide-in panel
- `<Dialog>` → Custom modal with backdrop
- `<CircularProgress>` → Spinner with `animate-spin`

#### Color Classes
- Primary: `bg-primary-600`, `text-primary-600`, `border-primary-600`
- Secondary: `bg-secondary-600`, `text-secondary-600`
- Success: `bg-green-500`, `text-green-500`
- Error: `bg-red-500`, `text-red-500`
- Warning: `bg-yellow-500`, `text-yellow-500`

#### Spacing
- `p: 2` → `p-2` (0.5rem = 8px)
- `m: 2` → `m-2`
- `mt: '64px'` → `mt-16` (4rem = 64px)
- `px: 3` → `px-3`
- `py: 2` → `py-2`

### Step 3: Run Development Server
```powershell
npm start
```
The app will run on http://localhost:3001

## Next Actions

1. Create all pending page files
2. Create all pending component files
3. Test each component individually
4. Integrate and test the full application
5. Fix any runtime errors
6. Ensure all features work correctly

## Notes
- All Redux store, actions, reducers remain unchanged
- All API calls remain unchanged
- Only UI layer changes from Material-UI to Tailwind CSS
- Dark mode works via `dark:` Tailwind classes
- Responsive design via `sm:`, `md:`, `lg:` breakpoints
