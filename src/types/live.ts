export type LiveStreamStatus = "CREATED" | "READY" | "LIVE" | "ENDED" | "FAILED";

export interface LiveStream {
    id : string;
    userId : string | null;
    title : string;
    description : string | null;
    status : LiveStreamStatus;
    signalingRoomId : string;
    startedAt : Date | null;
    endedAt : Date | null;
    createdAt : Date;
    updatedAt : Date;
}

export interface CreateLiveStreamInput {
    userId? : string;
    title : string;
    description? : string;
}

export interface LivePlaybackResponse {
    streamId : string;
    status : LiveStreamStatus;
    type : "webrtc";
    signalingUrl : string;
}