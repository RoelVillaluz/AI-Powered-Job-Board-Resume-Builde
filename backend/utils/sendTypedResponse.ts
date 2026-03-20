import { Response } from "express";
import { ApiSendResponse } from "../types/apiResponse.types";

export function sendTypedResponse<T>(
  res: Response,
  payload: { code: number; message: string; data?: T; success?: boolean },
  model?: string
): Response {
  const { code, success = true, data = null, message } = payload;
  const formattedMessage = model ? message.replace("(model)", model) : message;

  const response: ApiSendResponse<T> = { success, formattedMessage };
  if (data !== null) response.data = data;

  return res.status(code).json(response);
}