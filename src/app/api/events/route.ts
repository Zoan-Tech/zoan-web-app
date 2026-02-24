import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8091/api/v1";

// Configure route for SSE streaming - disable timeout
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// For Vercel: max is 300s on Hobby, 900s on Pro. For local dev, this can be higher.
// SSE connections should be long-lived, so use maximum allowed
export const maxDuration = 300; // 5 minutes (increase if on Vercel Pro plan)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get('postId');

  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
  }

  const backendUrl = `${BACKEND_URL}/events?postId=${postId}`;

  // Create an abort controller that we'll use to cancel the backend request
  // if the client disconnects
  const controller = new AbortController();

  // Listen for client disconnect
  request.signal.addEventListener('abort', () => {
    controller.abort();
  });

  try {
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Connection': 'keep-alive',
      },
      signal: controller.signal,
      // @ts-ignore - Next.js specific option to keep connection alive
      keepalive: true,
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: 'Failed to connect to SSE' },
        { status: 502 }
      );
    }

    // Create a ReadableStream that properly handles SSE streaming with error recovery
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        let isClosed = false;
        let buffer = ''; // Buffer to accumulate partial SSE events

        const cleanup = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              reader.releaseLock();
            } catch (e) {
              // Reader already released
            }
          }
        };

        try {
          while (!isClosed) {
            const { done, value } = await reader.read();

            if (done) {
              // Flush any remaining buffer
              if (buffer) {
                try {
                  controller.enqueue(encoder.encode(buffer));
                } catch {
                  // Could not flush buffer, client disconnected
                }
              }
              cleanup();
              controller.close();
              break;
            }

            // Decode chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Process complete SSE events (events end with \n\n)
            const events = buffer.split('\n\n');

            // Keep the last partial event in the buffer
            buffer = events.pop() || '';

            // Forward complete events
            for (const event of events) {
              if (event.trim()) {
                const completeEvent = event + '\n\n';

                try {
                  controller.enqueue(encoder.encode(completeEvent));
                } catch (enqueueError) {
                  cleanup();
                  isClosed = true;
                  break;
                }
              }
            }
          }
        } catch (error) {
          cleanup();

          // Don't error the controller if client disconnected
          if (!isClosed) {
            try {
              controller.error(error);
            } catch {
              // Controller already closed
            }
          }
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
