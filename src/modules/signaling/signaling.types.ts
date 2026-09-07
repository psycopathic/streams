export interface JoinBroadcasterMessage {
  type: "join_broadcaster";
  streamId: string;
}

export interface JoinViewerMessage {
  type: "join_viewer";
  streamId: string;
  viewerId: string;
}

export interface ViewerJoinedMessage {
  type: "viewer_joined";
  streamId: string;
  viewerId: string;
}

export interface ViewerLeftMessage {
  type: "viewer_left";
  streamId: string;
  viewerId: string;
}

export interface OfferMessage {
  type: "offer";
  streamId: string;
  viewerId: string;
  sdp: unknown;
}

export interface AnswerMessage {
  type: "answer";
  streamId: string;
  viewerId: string;
  sdp: unknown;
}

export interface IceCandidateMessage {
  type: "ice-candidate";
  streamId: string;
  viewerId: string;
  target: "broadcaster" | "viewer";
  candidate: unknown;
}

export interface StreamEndedMessage {
  type: "stream-ended";
  streamId: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ClientSignalMessage = JoinBroadcasterMessage | JoinViewerMessage | OfferMessage | AnswerMessage | IceCandidateMessage;
export type ServerSignalMessage =
  | ViewerJoinedMessage
  | ViewerLeftMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | StreamEndedMessage
  | ErrorMessage;
