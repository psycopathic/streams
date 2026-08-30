import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext } from "../types/common.types.js";

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T => {
  return storage.run(context, callback);
};

export const getRequestContext = (): RequestContext | undefined => storage.getStore();

export const setRequestUser = (userId: string): void => {
  const context = storage.getStore();
  if (context) context.userId = userId;
};
