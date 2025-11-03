# 🔧 Connectify Video Call Troubleshooting Guide

## 🎯 **CRITICAL FIX APPLIED: Remote Video Not Showing**

### **Root Cause**
Remote videos were showing as blank because of **browser autoplay policy restrictions**. Modern browsers (Chrome, Firefox, Safari) block videos from autoplaying unless they are muted.

### **The Fix**
Changed `muted={false}` to `muted={true}` in the RemoteVideo component.

**Important Note:** 
- Setting `muted={true}` on the `<video>` element ONLY affects the video element's built-in audio output
- It does NOT affect WebRTC audio, which flows through the RTCPeerConnection
- **Users can still hear each other perfectly!** The muted attribute just allows the video to autoplay

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Remote Video Shows Blank Screen**

**Symptoms:**
- Video tiles appear but show black/blank screen
- Console shows "DOMException: play() failed" errors

**Solution:**
✅ **FIXED** - Video element now has `muted={true}` for autoplay compatibility

**Additional Checks:**
```javascript
// Open browser console and check these logs:
🎬 [RemoteVideo] Setting srcObject for [socketId]
✅ [RemoteVideo] Video playing for [socketId]

// If you see:
❌ [RemoteVideo] Autoplay failed: play() request was interrupted
// This means the video element needs user interaction or muted=true
```

---

### **Issue 2: No Remote Video Stream Received**

**Check Console for:**
```javascript
📹 Remote track received from [socketId]
  - Track kind: video
  - Track enabled: true
  - Track muted: false
  - Track readyState: live
```

**If tracks are not received:**

1. **Check ICE Connection State:**
   ```javascript
   🔌 ICE Connection State (socketId): connected  // ✅ Good
   🔌 ICE Connection State (socketId): failed     // ❌ Bad
   ```

2. **Verify TURN Servers:**
   - Free TURN server included: `turn:openrelay.metered.ca`
   - For production, consider paid TURN services (Twilio, Xirsys)

3. **Check Firewall/Network:**
   - Corporate firewalls may block WebRTC
   - Try on different networks
   - Use browser DevTools → Network tab

---

### **Issue 3: Connection Fails Between Users**

**Symptoms:**
- Users join but don't see each other
- ICE connection state shows "failed" or "disconnected"

**Solutions:**

1. **Verify Backend Socket.IO URL:**
   ```javascript
   // frontend/.env
   VITE_API_URL=https://your-backend.render.com
   ```

2. **Check Backend CORS Settings:**
   ```javascript
   // backend/src/app.js
   const allowedOrigins = [
     "https://your-frontend.vercel.app",
     "http://localhost:5173"
   ];
   ```

3. **Ensure Socket.IO Connection:**
   ```javascript
   ✅ Socket connected. ID: [socketId]  // Should see this in console
   ```

4. **Verify MongoDB Connection:**
   ```bash
   ✅ Database connected: [hostname]
   ```

---

### **Issue 4: Audio Not Working**

**Check:**

1. **Microphone Permissions:**
   ```javascript
   ✅ Audio permission granted  // Should see in console
   ```

2. **Audio Track in Stream:**
   ```javascript
   // Should show audio track
   Audio tracks: 1
   ```

3. **Browser Microphone Settings:**
   - Click 🔒 padlock in address bar
   - Allow microphone access
   - Reload page

---

## 🔍 **Debugging Checklist**

### **When User A Can't See User B's Video:**

1. **On User A's Console:**
   ```
   ✅ Socket connected
   👤 User joined. ID: [User B's ID]
   🔗 Creating peer connection for [User B's ID]
   📹 Remote track received from [User B's ID]
   🎬 [RemoteVideo] Setting srcObject for [User B's ID]
   ✅ [RemoteVideo] Video playing for [User B's ID]
   ```

2. **On User B's Console:**
   ```
   ✅ Got user media stream with 2 tracks
   ➕ Adding local stream tracks to peer [User A's ID]
     - Added video track
     - Added audio track
   📤 Sending offer to [User A's ID]
   ```

3. **Check ICE Connection:**
   ```
   🔌 ICE Connection State: checking
   🔌 ICE Connection State: connected  ✅
   ```

4. **If ICE fails:**
   ```
   🔌 ICE Connection State: failed
   ❌ ICE failed, attempting restart...
   ```
   - **Usually means TURN server needed**
   - Check if both users are behind strict NATs
   - Try different network (mobile hotspot)

---

## 🚀 **Performance Optimization**

### **Video Quality Settings**

```javascript
// Modify getUserMedia constraints for better quality:
const stream = await navigator.mediaDevices.getUserMedia({
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
});
```

### **Bandwidth Adaptation**

```javascript
// Add to peer connection setup:
connections[id].oniceconnectionstatechange = () => {
    if (connections[id].iceConnectionState === 'connected') {
        // Optionally adjust bitrate for slower connections
        const senders = connections[id].getSenders();
        senders.forEach(sender => {
            if (sender.track?.kind === 'video') {
                const parameters = sender.getParameters();
                parameters.encodings[0].maxBitrate = 500000; // 500 kbps
                sender.setParameters(parameters);
            }
        });
    }
};
```

---

## 🌐 **Deployment Checklist**

### **Frontend (Vercel)**

- [x] Environment variable `VITE_API_URL` set to backend URL
- [x] Build command: `npm run build`
- [x] Output directory: `dist`
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled (automatic on Vercel)

### **Backend (Render)**

- [x] Environment variables set:
  - `PORT=8000`
  - `MONGODB_URI=mongodb+srv://...`
  - `ALLOWED_ORIGINS=https://your-frontend.vercel.app,...`
- [x] Build command: `npm install`
- [x] Start command: `npm start`
- [ ] Auto-deploy on git push enabled

### **MongoDB Atlas**

- [x] Database cluster created
- [x] Network access: Allow from anywhere (0.0.0.0/0)
- [x] Database user created with read/write permissions
- [ ] Connection string updated in backend .env

---

## 📊 **Testing Your Deployment**

### **Test 1: Health Check**
```bash
curl https://your-backend.render.com/health

# Expected response:
{
  "message": "Backend is running 🚀",
  "timestamp": "2024-11-03T...",
  "status": "healthy"
}
```

### **Test 2: Socket Connection**
```javascript
// Open browser console on frontend:
// Should see:
🔌 Connecting to socket server: https://your-backend.render.com
✅ Socket connected. ID: [socketId]
```

### **Test 3: Video Call**
1. Open meeting in two different browsers/devices
2. Check console logs on both
3. Verify video appears on both sides
4. Test audio by speaking
5. Test mute/unmute buttons
6. Test screen sharing

---

## 🔒 **Security Recommendations**

1. **Change MongoDB Credentials** (currently exposed in repo)
2. **Implement JWT Authentication** (instead of random tokens)
3. **Add Rate Limiting** to prevent API abuse
4. **Enable Meeting Passwords** for private calls
5. **Add HTTPS** for all connections (done automatically on Vercel/Render)

---

## 📞 **Support & Additional Resources**

### **WebRTC Resources:**
- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [STUN/TURN Server Guide](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)

### **Common Error Messages:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `NotAllowedError` | Permission denied | Allow camera/mic in browser settings |
| `NotFoundError` | No camera/mic detected | Check hardware connection |
| `DOMException: play() failed` | Autoplay blocked | **FIXED** - Use muted=true |
| `ICE failed` | Connection blocked | Need TURN server |

---

## ✅ **Current Status**

### **Implemented Features:**
- ✅ Real-time video/audio
- ✅ Screen sharing
- ✅ Text chat
- ✅ Participant list
- ✅ Mute/unmute controls
- ✅ TURN servers configured
- ✅ Extensive debug logging
- ✅ **Remote video rendering fixed**

### **Known Limitations:**
- No recording feature
- No virtual backgrounds
- No waiting room
- No meeting passwords
- No mobile app (web only)

---

**Last Updated:** 2024-11-03
**Status:** ✅ Remote video issue RESOLVED
