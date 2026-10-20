import { useEffect, useRef } from 'react';
import { peer } from './fixtures';
export type Peer = typeof peer;
const value = { peer, state: 'ready' as const, consumeNavigation() {}, power: { state:'awake', supply:'ac', keepAwake:'requested' } };
export function useRpc() { return value; }
export function useRpcEvent(event: string, handler: (payload:any)=>void) {
  const ref=useRef(handler);ref.current=handler;
  useEffect(()=>peer.on(event,payload=>ref.current(payload)),[event]);
}
