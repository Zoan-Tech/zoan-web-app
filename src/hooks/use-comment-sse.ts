import { useEffect, useState, useRef } from 'react';
import { getAccessToken, refreshAccessToken } from '@/lib/api';
import { CommentEventData, SSEStatus } from '@/types/feed';

interface UseCommentSSEOptions {
  postId: string;
  enabled?: boolean;
  onCommentCreated?: (data: CommentEventData) => void;
  onError?: (error: Event) => void;
}

export function useCommentSSE(options: UseCommentSSEOptions): SSEStatus {
  const { postId, enabled = true, onCommentCreated, onError } = options;
  const [status, setStatus] = useState<SSEStatus>({
    status: 'disconnected',
    reconnectAttempts: 0,
  });
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const isInitialMount = useRef(true);
  const isConnectingRef = useRef(false); // Prevent duplicate connections in Strict Mode
  const connectionIdRef = useRef<string | null>(null); // Track connection identity

  // Use refs for callbacks to prevent unnecessary reconnections
  const onCommentCreatedRef = useRef(onCommentCreated);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onCommentCreatedRef.current = onCommentCreated;
    onErrorRef.current = onError;
  }, [onCommentCreated, onError]);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const PING_TIMEOUT = 60000; // 60 seconds - backend sends pings every 30s, so 2x buffer
  const lastPingRef = useRef<number>(Date.now());
  const pingCheckIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      return;
    }

    // Prevent duplicate connections (React Strict Mode issue)
    if (isConnectingRef.current) {
      return;
    }

    // Check if we already have an active connection for this postId
    const currentConnectionId = `${postId}-${Date.now()}`;
    if (connectionIdRef.current === postId && eventSourceRef.current) {
      return;
    }

    connectionIdRef.current = postId;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear any existing ping check interval
    if (pingCheckIntervalRef.current) {
      clearInterval(pingCheckIntervalRef.current);
    }

    isConnectingRef.current = true;
    lastPingRef.current = Date.now();

    const abortController = new AbortController();
    let isClosed = false;

    const url = `/api/events?postId=${postId}`;

    // Only set connecting on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    // Create a mock EventSource-like object for compatibility
    const mockEventSource = {
      close: () => {
        isClosed = true;
        abortController.abort();
      },
      readyState: 0, // CONNECTING
    };

    eventSourceRef.current = mockEventSource as unknown as EventSource;

    const connectSSE = async () => {
      try {
        let response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          // On 401, try to refresh the token before reconnecting
          if (response.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken || isClosed) {
              throw new Error('Token refresh returned no token');
            }
            // Retry with the refreshed token
            response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Accept': 'text/event-stream',
              },
              signal: abortController.signal,
            });
            if (!response.ok) {
              throw new Error(`SSE retry after refresh failed: ${response.status}`);
            }
          } else {
            throw new Error(`SSE connection failed: ${response.status}`);
          }
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        mockEventSource.readyState = 1; // OPEN
        setStatus({ status: 'connected', reconnectAttempts: 0 });
        reconnectAttemptsRef.current = 0;
        lastPingRef.current = Date.now();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isClosed) {
          const { done, value } = await reader.read();

          if (done) {
            // Clean up ping check interval
            if (pingCheckIntervalRef.current) {
              clearInterval(pingCheckIntervalRef.current);
              pingCheckIntervalRef.current = undefined;
            }

            // If stream ended unexpectedly (not due to manual close), try to reconnect
            if (!isClosed && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
              reconnectAttemptsRef.current += 1;

              setStatus({
                status: 'disconnected',
                reconnectAttempts: reconnectAttemptsRef.current
              });

              reconnectTimeoutRef.current = setTimeout(() => {
                setReconnectTrigger(prev => prev + 1);
              }, delay);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (events end with \n\n)
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const event of events) {
            if (!event.trim()) continue;

            const lines = event.split('\n');
            let eventType = '';
            let eventData = '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7);
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6);
              }
            }

            // Handle different event types
            if (eventType === 'new_comment') {
              try {
                const data: CommentEventData = JSON.parse(eventData);
                onCommentCreatedRef.current?.(data);
              } catch (error) {
                // Silently ignore parse errors
              }
            } else if (eventType === 'ping') {
              lastPingRef.current = Date.now();
            } else if (eventType === 'connected') {
              lastPingRef.current = Date.now();
            } else if (eventData && eventData.startsWith('{')) {
              // Generic message handler for events without explicit type
              try {
                const data = JSON.parse(eventData);
                if (data.id && data.content) {
                  onCommentCreatedRef.current?.(data);
                }
              } catch {
                // Silently ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        // Clean up ping check interval on error
        if (pingCheckIntervalRef.current) {
          clearInterval(pingCheckIntervalRef.current);
          pingCheckIntervalRef.current = undefined;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        mockEventSource.readyState = 2; // CLOSED
        onErrorRef.current?.(error as Event);

        // Attempt reconnection with exponential backoff
        if (!isClosed && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;

          setStatus({
            status: 'disconnected',
            reconnectAttempts: reconnectAttemptsRef.current
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectTrigger(prev => prev + 1);
          }, delay);
        } else {
          setStatus({ status: 'error', reconnectAttempts: reconnectAttemptsRef.current });
        }
      }
    };

    connectSSE();

    return () => {
      isClosed = true;
      isConnectingRef.current = false; // Reset connecting flag

      // Only reset connectionId if it matches this connection
      if (connectionIdRef.current === postId) {
        connectionIdRef.current = null;
      }

      abortController.abort();

      // Clean up timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (pingCheckIntervalRef.current) {
        clearInterval(pingCheckIntervalRef.current);
        pingCheckIntervalRef.current = undefined;
      }
    };
  }, [postId, enabled, reconnectTrigger]); // Removed callback dependencies

  return status;
}
