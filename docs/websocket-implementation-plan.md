# WebSocket Implementation Plan

## Current Issue with Polling

The current polling approach has several problems:
- **Inefficient**: Makes HTTP requests every second
- **Resource Heavy**: Consumes server resources unnecessarily  
- **Doesn't Stop**: Continues polling even after completion
- **Latency**: 1-second delay between updates
- **Scalability**: Poor performance with many concurrent users

## WebSocket Solution Benefits

✅ **Real-time Updates**: Instant progress notifications
✅ **Efficient**: Single persistent connection
✅ **Automatic Cleanup**: Connection closes when complete
✅ **Scalable**: Better resource utilization
✅ **Lower Latency**: Immediate updates

## Implementation Options

### Option 1: Native WebSocket (Current Fallback)
- **Pros**: No additional dependencies
- **Cons**: Complex setup in Next.js, requires custom server
- **Status**: Implemented fallback with reduced polling (2-second intervals)

### Option 2: Socket.io (Recommended)
```bash
npm install socket.io socket.io-client
```

**Server Setup:**
```typescript
// lib/socket-server.ts
import { Server } from 'socket.io';

export function initializeSocket(server: any) {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    socket.on('subscribe-progress', (checkRunId) => {
      socket.join(`check-${checkRunId}`);
    });
  });
  
  return io;
}

// Broadcast progress updates
export function broadcastProgress(io: Server, checkRunId: string, data: any) {
  io.to(`check-${checkRunId}`).emit('progress-update', data);
}
```

**Client Usage:**
```typescript
// In enhanced-loading.tsx
import { io } from 'socket.io-client';

const socket = io();
socket.emit('subscribe-progress', checkRunId);
socket.on('progress-update', (data) => {
  setCurrentMessage(data.message);
  setProgress(data.progress);
});
```

### Option 3: Third-party Service (Production Ready)
- **Pusher**: Easy setup, reliable
- **Ably**: Real-time messaging platform
- **AWS IoT Core**: For AWS-based infrastructure

## Current Implementation (Improved Polling)

Since WebSocket setup in Next.js requires additional server configuration, I've implemented an improved polling approach:

### Key Improvements:
1. **Reduced Frequency**: 2 seconds instead of 1 second
2. **Smart Termination**: Stops immediately when complete
3. **Better Error Handling**: Falls back to simulation gracefully
4. **Message Mapping**: Converts backend logs to user-friendly messages

### Code Changes:
```typescript
// Instead of continuous polling every 1 second:
const interval = setInterval(pollProgress, 1000);

// Now uses recursive timeout with 2-second intervals:
setTimeout(checkProgress, 2000);

// Stops automatically when complete:
if (data.status === 'COMPLETED' || data.status === 'FAILED') {
  setIsComplete(true);
  // No more requests after this point
}
```

## Next Steps for Full WebSocket Implementation

### 1. Add Socket.io Dependencies
```bash
npm install socket.io socket.io-client @types/socket.io
```

### 2. Create Custom Server
```typescript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);
  
  io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('subscribe-progress', (checkRunId) => {
      socket.join(`check-${checkRunId}`);
      console.log(`Client subscribed to check-${checkRunId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
```

### 3. Update Backend to Emit Events
```typescript
// In lib/compliance-hybrid.ts
import { io } from '../socket-server';

// Emit progress updates during analysis
io.to(`check-${checkRunId}`).emit('progress-update', {
  message: 'Themis is starting analysis...',
  progress: 10,
  status: 'IN_PROGRESS'
});
```

### 4. Update Package.json
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

## Current Status

✅ **Improved Polling**: Reduced from 1s to 2s intervals
✅ **Smart Termination**: Stops when analysis completes  
✅ **Better UX**: User-friendly message mapping
✅ **Fallback Ready**: Graceful degradation to simulation
🔄 **WebSocket Ready**: Infrastructure prepared for full implementation

The current implementation provides a much better experience than the original polling approach while maintaining the foundation for a full WebSocket upgrade when needed.