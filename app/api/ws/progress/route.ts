import { NextRequest } from 'next/server';

// Store WebSocket connections by checkRunId
// WebSocket connections are managed in @/lib/websocket.ts

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkRunId = searchParams.get('checkRunId');

  if (!checkRunId) {
    return new Response('Missing checkRunId', { status: 400 });
  }

  // Check if the request is a WebSocket upgrade
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // Note: This is a simplified example. In a production environment,
    // you'd want to use a proper WebSocket server like ws or socket.io
    // For now, we'll return a response indicating WebSocket support
    return new Response('WebSocket endpoint ready', {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    });
  } catch (error) {
    console.error('WebSocket upgrade failed:', error);
    return new Response('WebSocket upgrade failed', { status: 500 });
  }
}


// Note: WebSocket helpers have been moved to @/lib/websocket.ts