'use client';

import { useSSE } from '@/providers/sse-provider';
import { WifiSlashIcon, ArrowsClockwiseIcon, CheckCircleIcon } from '@phosphor-icons/react';

export function ConnectionStatus() {
  const { status } = useSSE();

  // Don't show anything if connected
  if (status.status === 'connected') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg border border-gray-200">
        {status.status === 'disconnected' && (
          <>
            <ArrowsClockwiseIcon className="h-4 w-4 animate-spin text-yellow-500" />
            <span className="text-sm text-gray-700">
              Reconnecting{status.reconnectAttempts > 0 ? ` (${status.reconnectAttempts}/10)` : ''}...
            </span>
          </>
        )}
        {status.status === 'error' && (
          <>
            <WifiSlashIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-700">
              Connection failed
            </span>
          </>
        )}
      </div>
    </div>
  );
}
