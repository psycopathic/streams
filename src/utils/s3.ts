import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream, createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

import { ERROR_CODES } from "../constants/index.js";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucket = env.AWS_S3_BUCKET;

export const downloadFromS3 = async (key: string, destinationPath: string) => {
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!(response.Body instanceof Readable)) {
    throw new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, "S3 object is not readable");
  }
  await pipeline(response.Body, createWriteStream(destinationPath));
};

export const uploadFileToS3 = async (sourcePath: string, key: string, contentType: string) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(sourcePath),
      ContentType: contentType,
    }),
  );

  return key;
};

export const createPresignedUploadUrl = async (key: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: env.UPLOAD_URL_EXPIRY });
};

export const generateUploadUrl = createPresignedUploadUrl;

export const verifyObjectExists = async (key: string) => {
  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3.send(command);
  return true;
};

export const getObjectMetadata = verifyObjectExists;
export { s3, bucket };
