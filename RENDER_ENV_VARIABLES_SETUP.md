# Environment Variables Configuration Guide for Render Deployment

## 📋 Copy These to Render Dashboard

### yunichat-auth Service
```
SPRING_DATASOURCE_URL=postgresql://yunichat_user:lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq@dpg-d4q2il2dbo4c73bkg6q0-a/yunichat
SPRING_DATASOURCE_USERNAME=yunichat_user
SPRING_DATASOURCE_PASSWORD=lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq
JWT_SECRET=YuniChat-Super-Secret-Key-For-JWT-Token-Generation-Min-32-Chars-2025
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=86400000
```

### yunichat-user Service
```
SPRING_DATASOURCE_URL=postgresql://yunichat_user:lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq@dpg-d4q2il2dbo4c73bkg6q0-a/yunichat
SPRING_DATASOURCE_USERNAME=yunichat_user
SPRING_DATASOURCE_PASSWORD=lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq
JWT_SECRET=YuniChat-Super-Secret-Key-For-JWT-Token-Generation-Min-32-Chars-2025
```

### yunichat-chat Service
```
SPRING_DATASOURCE_URL=postgresql://yunichat_user:lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq@dpg-d4q2il2dbo4c73bkg6q0-a/yunichat
SPRING_DATASOURCE_USERNAME=yunichat_user
SPRING_DATASOURCE_PASSWORD=lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq
JWT_SECRET=YuniChat-Super-Secret-Key-For-JWT-Token-Generation-Min-32-Chars-2025
```

### yunichat-file Service
```
SPRING_DATASOURCE_URL=postgresql://yunichat_user:lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq@dpg-d4q2il2dbo4c73bkg6q0-a/yunichat
SPRING_DATASOURCE_USERNAME=yunichat_user
SPRING_DATASOURCE_PASSWORD=lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq
```

### yunichat-notification Service
```
SPRING_DATASOURCE_URL=postgresql://yunichat_user:lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq@dpg-d4q2il2dbo4c73bkg6q0-a/yunichat
SPRING_DATASOURCE_USERNAME=yunichat_user
SPRING_DATASOURCE_PASSWORD=lgq3oVGWhC17e4to2q8q4YJvcg9AoDIq
JWT_SECRET=YuniChat-Super-Secret-Key-For-JWT-Token-Generation-Min-32-Chars-2025
```

### yunichat-gateway Service
```
AUTH_SERVICE_URL=https://yunichat-auth.onrender.com
USER_SERVICE_URL=https://yunichat-user.onrender.com
CHAT_SERVICE_URL=https://yunichat-chat.onrender.com
FILE_SERVICE_URL=https://yunichat-file.onrender.com
NOTIFICATION_SERVICE_URL=https://yunichat-notification.onrender.com
JWT_SECRET=YuniChat-Super-Secret-Key-For-JWT-Token-Generation-Min-32-Chars-2025
```

## ⚠️ IMPORTANT NOTES:

1. **Use INTERNAL database URL** (without .singapore-postgres.render.com) for services on Render
2. **JWT_SECRET must be the same** across all services
3. **After adding environment variables**, click "Manual Deploy" → "Clear build cache & deploy"
4. **Wait 5-10 minutes** for each service to fully redeploy

## 🚀 Deployment Order:
1. Start with auth-service (most critical)
2. Then user-service
3. Then chat, file, notification services
4. Finally gateway (depends on all others)

## 🔍 Verification:
After each service deploys, test health endpoint:
```
https://yunichat-auth.onrender.com/actuator/health
https://yunichat-user.onrender.com/actuator/health
https://yunichat-gateway.onrender.com/actuator/health
```
Should return: `{"status":"UP"}`
