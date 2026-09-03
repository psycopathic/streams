import { v4 as uuid } from "uuid";
import { createPresignedUploadUrl } from "../../../utils/s3.js";
import { createVideo } from "../repositories/video.repository.js";
import { InitializeUploadRequest } from "../../../types/video.js";
import { logger } from "../../../config/logger.js";


//the extensionByContentType object maps content types to file extensions. 
// It is used to determine the correct file extension for a video file based on its content type. 
// If the content type is not recognized, it defaults to "mp4".
const extensionByContentType: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
};

//getsafeextension function takes a filename and a content type as input and returns the appropriate file extension.
//by comparing it with the extensionByContentType object
const getSafeExtension = (filename: string, contentType: string) => {
    const filenameExtension = filename.split(".").pop()?.toLowerCase();
    const contentTypeExtension = extensionByContentType[contentType];
    return contentTypeExtension ?? filenameExtension ?? "mp4";
}

//createupload is a service function that handles the creation of a new video upload.
// here we are uploading the video to s3 bucket and creating a record in the database for the video
export const createUpload = async (data: InitializeUploadRequest) => {
   const videoId = uuid();
   const extension = getSafeExtension(data.filename, data.contentType);
   const storageKey = `videos/${videoId}/original/source.${extension}`;
   const video = await createVideo({
        id: videoId,
        title: data.title,
        description: data.description,
        originalFilename: data.filename,
        originalStorageKey: storageKey
    });

    const uploadUrl = await createPresignedUploadUrl(storageKey, data.contentType);
    logger.info(`Created upload for video ${videoId} with storage key ${storageKey}`);
    return {
        message: "Upload initialized",
        videoId: video.id,
        uploadUrl,
        storageKey,
        status: video.status,
    }
}

//we will use the uploadUrl to upload the video file to the S3 bucket. 
// Once the upload is complete, we can call the completeUpload function to update the video 
// status in the database and trigger any further processing that may be required.