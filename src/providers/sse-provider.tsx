'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCommentSSE } from '@/hooks/use-comment-sse';
import { CommentEventData, SSEStatus } from '@/types/feed';

interface SSEContextValue {
  status: SSEStatus;
  subscribe: (postId: string, callback: (data: CommentEventData) => void) => () => void;
}

const SSEContext = createContext<SSEContextValue | null>(null);

interface SSEProviderProps {
  children: ReactNode;
  postId: string;
  enabled?: boolean;
}

export function SSEProvider({ children, postId, enabled = true }: SSEProviderProps) {
  const callbacksRef = React.useRef<Map<string, (data: CommentEventData) => void>>(new Map());

  const handleCommentCreated = React.useCallback((data: CommentEventData) => {
    // Call all subscribed callbacks
    callbacksRef.current.forEach((callback) => {
      callback(data);
    });
  }, []);

  const status = useCommentSSE({
    postId,
    enabled,
    onCommentCreated: handleCommentCreated,
  });

  const subscribe = React.useCallback((id: string, callback: (data: CommentEventData) => void) => {
    callbacksRef.current.set(id, callback);

    // Return unsubscribe function
    return () => {
      callbacksRef.current.delete(id);
    };
  }, []);

  const value = React.useMemo(() => ({ status, subscribe }), [status, subscribe]);

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
}

export function useSSE() {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSE must be used within SSEProvider');
  }
  return context;
}
