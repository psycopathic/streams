import { execFile } from "child_process";
import { promisify } from "util";
import { TranscodeTarget, VideoProbeResult } from "../types/video.js";

const execFileAsync = promisify(execFile);

interface FFprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  bit_rate?: string;
}

interface FFprobeOutput {
  streams?: FFprobeStream[];
  format?: {
    duration?: string;
    bit_rate?: string;
    format_name?: string;
  };
}

const toNumber = (value: string | undefined) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const probeVideo = async (filePath: string): Promise<VideoProbeResult> => {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    filePath,
  ]);
  const output = JSON.parse(stdout) as FFprobeOutput;
  const videoStream = output.streams?.find((stream) => stream.codec_type === "video");
  const audioStream = output.streams?.find((stream) => stream.codec_type === "audio");

  return {
    duration: toNumber(output.format?.duration),
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
    videoCodec: videoStream?.codec_name ?? null,
    audioCodec: audioStream?.codec_name ?? null,
    videoBitrate: toNumber(videoStream?.bit_rate) ?? toNumber(output.format?.bit_rate),
    audioBitrate: toNumber(audioStream?.bit_rate),
    format: output.format?.format_name ?? null,
  };
};

export const transcodeVideo = async (
  inputPath: string,
  outputPath: string,
  target: TranscodeTarget,
) => {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    `scale=-2:${target.height}`,
    "-c:v",
    "libx264",
    "-b:v",
    target.videoBitrate,
    "-c:a",
    "aac",
    "-b:a",
    target.audioBitrate,
    "-movflags",
    "+faststart",
    outputPath,
  ]);
};
