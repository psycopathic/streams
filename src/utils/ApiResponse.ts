import { Response } from "express";

type ApiResponseBody = Record<string, unknown>;

export const successResponse = (res: Response, message: {}, statusCode: number = 200) => {
  return res.status(statusCode).json({
    message,
    success: true,
  });
};

export const failureResponse = (res: Response, message: {}, statusCode: number = 400) => {
  return res.status(statusCode).json({
    message,
    success: false,
  });
};

export const ApiResponse = {
  success: (res: Response, statusCode: number, body: ApiResponseBody) => {
    return res.status(statusCode).json({
      success: true,
      ...body,
    });
  },
  error: (res: Response, statusCode: number, body: ApiResponseBody) => {
    return res.status(statusCode).json({
      success: false,
      ...body,
    });
  },
};
