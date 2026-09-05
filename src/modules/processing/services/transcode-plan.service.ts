import { TranscodeTarget } from "../../../types/video.js";

const target: TranscodeTarget[] = [
  { resolution: "360p", width: 640, height: 360, videoBitrate: "800k", audioBitrate: "96k" },
  { resolution: "720p", width: 1280, height: 720, videoBitrate: "2500k", audioBitrate: "128k" },
  { resolution: "1080p", width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k" },
];

export const getTranscodeTargets = (sourceHeight: number | null): TranscodeTarget[] => {
  if (!sourceHeight) return [];
  return target.filter((t) => t.height <= sourceHeight);
};

export const bitrateToNumber = (bitrate: string): number => {
  const match = Number(bitrate.replace("k", "000"));
  return match;
};
