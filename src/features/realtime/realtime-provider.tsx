import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { isDemoMode } from '@/config/demo';
import { supabase } from '@/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface RealtimeContextValue {
  status: ConnectionStatus;
  channel: RealtimeChannel | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'disconnected',
  channel: null,
});

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  boardId: string;
  children: ReactNode;
}

export function RealtimeProvider({ boardId, children }: RealtimeProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>(
    isDemoMode ? 'connected' : 'connecting',
  );
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const setupChannel = useCallback(() => {
    if (isDemoMode) return;

    const ch = supabase.channel(`board:${boardId}`, {
      config: { broadcast: { self: false } },
    });

    ch.on('presence', { event: 'sync' }, () => {
      setStatus('connected');
    });

    ch.subscribe((subscribeStatus: string) => {
      if (subscribeStatus === 'SUBSCRIBED') {
        setStatus('connected');
      } else if (subscribeStatus === 'CHANNEL_ERROR') {
        setStatus('disconnected');
      }
    });

    setChannel(ch);
    return ch;
  }, [boardId]);

  useEffect(() => {
    const ch = setupChannel();
    return () => {
      if (ch) {
        void supabase.removeChannel(ch);
      }
    };
  }, [setupChannel]);

  return (
    <RealtimeContext.Provider value={{ status, channel }}>
      {children}
    </RealtimeContext.Provider>
  );
}
