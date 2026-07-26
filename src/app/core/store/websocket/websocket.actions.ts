import { createAction, props } from '@ngrx/store';

export const wsConnect = createAction(
  '[WebSocket] Connect',
  props<{ token: string; userId: string }>()
);

export const wsDisconnect = createAction('[WebSocket] Disconnect');

export const wsConnectionLost = createAction('[WebSocket] Connection Lost');

export const wsReconnecting = createAction(
  '[WebSocket] Reconnecting',
  props<{ attempt: number; delay: number }>()
);

export const wsHeartbeatPing = createAction('[WebSocket] Heartbeat Ping');

export const wsHeartbeatPong = createAction('[WebSocket] Heartbeat Pong');
