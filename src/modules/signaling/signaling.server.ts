import type { Server } from "node:http";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { logger } from "../../config/logger.js";
import { markStreamLive, stopStream } from "../live/services/live.service.js";
import type { ClientSignalMessage, ServerSignalMessage } from "./signaling.types.js";
import { getOrCreateRoom, getRoom, removeBroadcaster, removeViewer } from "./signaling.rooms.js";

interface SocketState {
  role: "broadcaster" | "viewer" | null;
  streamId: string | null;
  viewerId: string | null;
}
const socketState = new WeakMap<WebSocket, SocketState>();

const send = (socket: WebSocket, message: ServerSignalMessage): void => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
};

const sendError = (socket: WebSocket, message: string): void => {
  send(socket, { type: "error", message });
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isClientSignalMessage = (value: unknown): value is ClientSignalMessage => {
  if (!isObject(value) || !isNonEmptyString(value.type) || !isNonEmptyString(value.streamId)) {
    return false;
  }

  switch (value.type) {
    case "join_broadcaster":
      return true;
    case "join_viewer":
    case "offer":
    case "answer":
      return isNonEmptyString(value.viewerId);
    case "ice-candidate":
      return isNonEmptyString(value.viewerId) && (value.target === "broadcaster" || value.target === "viewer");
    default:
      return false;
  }
};

const parseMessage = (message: RawData): ClientSignalMessage | null => {
  const data = Array.isArray(message)
    ? Buffer.concat(message).toString()
    : Buffer.isBuffer(message)
      ? message.toString()
      : Buffer.from(message).toString();

  try {
    const parsed: unknown = JSON.parse(data);
    return isClientSignalMessage(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const handleJoinBroadcaster = async (socket: WebSocket, streamId: string): Promise<void> => {
  const room = getOrCreateRoom(streamId);
  if (room.broadcaster && room.broadcaster.readyState === WebSocket.OPEN) {
    sendError(socket, "Broadcaster already exists for this stream");
    return;
  }

  await markStreamLive(streamId);

  room.broadcaster = socket;
  socketState.set(socket, {
    role: "broadcaster",
    streamId,
    viewerId: null,
  });
  logger.info(`Broadcaster joined stream ${streamId}`);
};
const handleJoinViewer = (socket: WebSocket, streamId: string, viewerId: string) => {
  const room = getRoom(streamId);

  if (!room?.broadcaster) {
    sendError(socket, "Broadcaster is not connected");
    return;
  }

  const existingViewer = room.viewers.get(viewerId);
  if (existingViewer?.socket.readyState === WebSocket.OPEN) {
    sendError(socket, "Viewer already exists for this stream");
    return;
  }

  room.viewers.set(viewerId, { viewerId, socket });

  socketState.set(socket, {
    role: "viewer",
    streamId,
    viewerId,
  });

  send(room.broadcaster, {
    type: "viewer_joined",
    streamId,
    viewerId,
  });

  logger.info("Viewer joined live stream", { streamId, viewerId });
};

const forwardToViewer = (message: ClientSignalMessage & { viewerId: string }): void => {
  const room = getRoom(message.streamId);
  const viewer = room?.viewers.get(message.viewerId);

  if (!viewer) {
    return;
  }

  send(viewer.socket, message as ServerSignalMessage);
};

const forwardToBroadcaster = (message: ClientSignalMessage & { viewerId: string }): void => {
  const room = getRoom(message.streamId);

  if (!room?.broadcaster) {
    return;
  }

  send(room.broadcaster, message as ServerSignalMessage);
};

const handleDisconnect = async (socket: WebSocket): Promise<void> => {
  const state = socketState.get(socket);

  if (!state?.streamId) {
    return;
  }

  const room = getRoom(state.streamId);

  if (state.role === "viewer" && state.viewerId) {
    removeViewer(state.streamId, state.viewerId, socket);

    if (room?.broadcaster) {
      send(room.broadcaster, {
        type: "viewer_left",
        streamId: state.streamId,
        viewerId: state.viewerId,
      });
    }

    return;
  }

  if (state.role === "broadcaster") {
    if (room) {
      for (const viewerSocket of room.viewers.values()) {
        send(viewerSocket.socket, {
          type: "stream-ended",
          streamId: state.streamId,
        });
      }
    }

    removeBroadcaster(state.streamId, socket);
    try {
      await stopStream(state.streamId);
    } catch (error) {
      logger.warn("Failed to mark disconnected stream as ended", { error, streamId: state.streamId });
    }

    logger.info("Broadcaster disconnected, stream ended", { streamId: state.streamId });
  }
};

export const attachSignalingServer = (server: Server): void => {
  const wss = new WebSocketServer({
    server,
    path: "/ws/live",
  });

  wss.on("connection", (socket) => {
    socketState.set(socket, {
      role: null,
      streamId: null,
      viewerId: null,
    });

    socket.on("message", (raw) => {
      void (async () => {
        try {
          const message = parseMessage(raw);

          if (!message) {
            sendError(socket, "Invalid signaling message");
            return;
          }

          switch (message.type) {
            case "join_broadcaster":
              await handleJoinBroadcaster(socket, message.streamId);
              break;

            case "join_viewer":
              handleJoinViewer(socket, message.streamId, message.viewerId);
              break;

            case "offer":
              forwardToViewer(message);
              break;

            case "answer":
              forwardToBroadcaster(message);
              break;

            case "ice-candidate":
              if (message.target === "viewer") {
                forwardToViewer(message);
              } else {
                forwardToBroadcaster(message);
              }
              break;
          }
        } catch (error) {
          logger.warn("Failed to handle WebRTC signaling message", { error });
          sendError(socket, error instanceof Error ? error.message : "Failed to handle signaling message");
        }
      })();
    });

    socket.on("close", () => {
      void handleDisconnect(socket).catch((error: unknown) => {
        logger.warn("Failed to handle WebSocket disconnect", { error });
      });
    });

    socket.on("error", (error) => {
      logger.error("WebSocket signaling error", { error });
    });
  });

  logger.info("WebRTC signaling server attached at /ws/live");
};
