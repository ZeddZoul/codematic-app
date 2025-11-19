// Store WebSocket connections by checkRunId
export const connections = new Map<string, WebSocket>();

// Helper function to broadcast progress updates
export function broadcastProgress(checkRunId: string, data: any) {
  const ws = connections.get(checkRunId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'progress',
      checkRunId,
      data
    }));
  }
}

// Helper function to broadcast completion
export function broadcastComplete(checkRunId: string, data: any) {
  const ws = connections.get(checkRunId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'complete',
      checkRunId,
      data
    }));
    
    // Clean up connection after completion
    setTimeout(() => {
      connections.delete(checkRunId);
      ws.close();
    }, 2000);
  }
}
