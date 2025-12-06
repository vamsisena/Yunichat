# YuniChat Tailwind Frontend

A modern, Tailwind CSS-based UI implementation of YuniChat - a real-time messaging application.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Backend services running (see YuniChat Backend)

### Installation

1. Install dependencies:
```powershell
npm install
```

2. Start the development server:
```powershell
npm start
```

The application will open at **http://localhost:3001**

### Build for Production

```powershell
npm run build
```

## 📁 Project Structure

```
src/
├── api/              # API client and services
├── app/              # Redux store configuration
├── components/       # Reusable UI components
├── features/         # Redux actions, reducers, types
├── hooks/            # Custom React hooks
├── layouts/          # Page layouts (Main, Auth)
├── pages/            # Application pages
├── utils/            # Utility functions
├── App.js            # Root application component
└── index.js          # Application entry point
```

## 🎨 Technology Stack

### Core
- **React 18.2.0** - UI library
- **React Router 6.20.0** - Routing
- **Redux Toolkit 1.9.7** - State management
- **Redux Thunk 2.4.2** - Async actions

### Styling
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Heroicons 2.0.18** - Icon library
- **PostCSS & Autoprefixer** - CSS processing

### Real-time Communication
- **STOMP.js 7.2.1** - WebSocket client
- **SockJS Client 1.6.1** - WebSocket fallback

### HTTP Client
- **Axios 1.6.2** - API requests

## 🔑 Key Features

- ✅ Real-time messaging via WebSocket
- ✅ Private chat and public chat rooms
- ✅ Friend system (requests, accept/decline)
- ✅ User presence and status
- ✅ Typing indicators
- ✅ Message reactions
- ✅ Voice messages
- ✅ File attachments
- ✅ Dark mode support
- ✅ Responsive design (mobile & desktop)
- ✅ Guest login support

## 🎨 Tailwind CSS Implementation

### Custom Classes

The project includes several custom Tailwind components defined in `src/index.css`:

- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons
- `.input-field` - Form input fields
- `.card` - Card containers
- `.scrollbar-thin` - Custom thin scrollbar

### Theme Configuration

Colors and theme are configured in `tailwind.config.js`:

- **Primary**: Blue shades (50-900)
- **Secondary**: Purple shades (50-900)
- **Dark Mode**: Enabled via `class` strategy

### useSelector Pattern

**All components follow this pattern:**

```javascript
const storeData = useSelector((state) => {
  return {
    prop1: state?.slice?.prop1 || defaultValue,
    prop2: state?.slice?.prop2 || defaultValue,
  };
});
const { prop1, prop2 } = storeData;
```

## 🔌 API Integration

### Base URL
The API base URL is configured in `src/utils/constants.js`:
- Default: `http://localhost:8080/api`
- Can be overridden via `REACT_APP_API_BASE_URL` environment variable

### WebSocket Endpoints
- Chat: `http://localhost:8080/ws/chat`
- Notifications: `http://localhost:8080/ws/notifications`

## 🌙 Dark Mode

Dark mode is implemented using Tailwind's dark mode feature:

- Toggle via theme context
- Persisted in localStorage
- Applied via `dark:` class prefix

```javascript
import { useThemeMode } from './App';

const { isDarkMode, toggleTheme } = useThemeMode();
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 768px (md)
- **Desktop**: > 768px (lg, xl, 2xl)

## 🧩 Component Guidelines

### Icons
Use Heroicons instead of Material-UI icons:

```javascript
import { ChatBubbleLeftIcon, UserIcon } from '@heroicons/react/24/outline';
// or for solid icons
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid';
```

### Styling
Use Tailwind utility classes instead of inline styles:

```javascript
// ✅ Good
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">

// ❌ Avoid
<div style={{ display: 'flex', padding: '16px' }}>
```

### State Management
Always use the standard useSelector pattern:

```javascript
const storeData = useSelector((state) => {
  return {
    // ... state mappings
  };
});
```

## 🐛 Debugging

### Development Tools
- React DevTools - Component inspection
- Redux DevTools - State inspection
- Browser Console - Network and errors

### Common Issues

**Port already in use:**
```powershell
# Kill process on port 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
```

**WebSocket connection failed:**
- Ensure backend services are running
- Check backend URL in constants.js
- Verify firewall settings

## 📄 Scripts

- `npm start` - Start development server (port 3001)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🔗 Related Projects

- **YuniChat Backend** - Java Spring Boot microservices
- **YuniChat Frontend** - Original Material-UI implementation

## 📝 License

This project is part of the YuniChat application suite.

## 👥 Contributing

1. Follow the useSelector pattern
2. Use Tailwind CSS classes (no inline styles)
3. Use Heroicons for icons
4. Maintain dark mode support
5. Ensure responsive design
6. Test on multiple browsers

## 🆘 Support

For issues or questions:
1. Check IMPLEMENTATION_STATUS.md
2. Review component examples
3. Consult Tailwind CSS documentation
4. Check Heroicons documentation

---

**Last Updated:** December 2, 2025
**Version:** 1.0.0
**Port:** 3001
