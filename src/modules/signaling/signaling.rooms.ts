import type { WebSocket } from "ws";

export interface ViewerConnection {
  viewerId: string;
  socket: WebSocket;
}
export interface SignalingRoom {
  streamId: string;
  broadcaster: WebSocket | null;
  viewers: Map<string, ViewerConnection>;
}

const rooms = new Map<string, SignalingRoom>();

export const getOrCreateRoom = (streamId: string): SignalingRoom => {
  const existingRoom = rooms.get(streamId);
  if (existingRoom) {
    return existingRoom;
  }
  const room: SignalingRoom = {
    streamId,
    broadcaster: null,
    viewers: new Map(),
  };
  rooms.set(streamId, room);
  return room;
};
export const getRoom = (streamId: string): SignalingRoom | null => {
  return rooms.get(streamId) ?? null;
};
export const removeViewer = (streamId: string, viewerId: string, socket?: WebSocket): void => {
  const room = rooms.get(streamId);
  if (!room) {
    return;
  }

  const viewer = room.viewers.get(viewerId);
  if (socket && viewer?.socket !== socket) {
    return;
  }

  room.viewers.delete(viewerId);
  if (!room.broadcaster && room.viewers.size === 0) {
    rooms.delete(streamId);
  }
};

export const removeBroadcaster = (streamId: string, socket?: WebSocket): void => {
  const room = rooms.get(streamId);
  if (!room) {
    return;
  }

  if (socket && room.broadcaster !== socket) {
    return;
  }

  room.broadcaster = null;
  if (room.viewers.size === 0) {
    rooms.delete(streamId);
  }
};
