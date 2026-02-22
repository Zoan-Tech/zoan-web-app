'use client';

import { SSEProvider } from '@/providers/sse-provider';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { ReactNode } from 'react';

export function SSEWrapper({ postId, children }: { postId: string; children: ReactNode }) {
  return (
    <SSEProvider postId={postId}>
      {children}
      <ConnectionStatus />
    </SSEProvider>
  );
}
