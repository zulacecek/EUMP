import { confirmClose } from "./systemCommunication";

export type BaseCommunicationRequest = {
  callerName: string;
  message: string;
  requestId: string;
};

export type BaseCommunicationResponse<T = any> = {
  result: LayerCommunicationResult;
  callerName: string;
  message: string;
  requestId: string;
  payload: T;
  hasPayload: boolean;
};

export enum LayerCommunicationResult {
    Unknown = "Unknown",
    NOK = "NOK",
    OK = "OK"
}

interface PendingRequest {
  resolve: ResolveFunction<any>;
  reject: RejectFunction;
  timeout: number;
}

export function initializeMessageReceiver() {
  (window.external as any).receiveMessage((message: string) => {
    messageDispatcher(message);
  });
}

type ResolveFunction<T> = (response: BaseCommunicationResponse<T>) => void;
type RejectFunction = (error: any) => void;
const pendingRequests = new Map<string, PendingRequest>();

function messageDispatcher(rawMessage: string) {
  try {
    const parsed = tryParsePayload(rawMessage) as BaseCommunicationResponse;

    if (!parsed || !parsed.requestId) {
      console.warn("Invalid message received", parsed);
      return;
    }

    const pending = pendingRequests.get(parsed.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingRequests.delete(parsed.requestId);

      try {
        parsed.payload = tryParsePayload(parsed.message);
        parsed.hasPayload = true;
      } catch {
        parsed.hasPayload = false;
      }

      pending.resolve(parsed);
    } else {
      // One-way message
      handleOneWayMessage(parsed);
    }
  } catch (e) {
    console.error("Failed to dispatch message", e);
  }
}

export async function sendRequest<T>(
  request: Omit<BaseCommunicationRequest, 'requestId'>,
  timeoutMs = 60000
): Promise<BaseCommunicationResponse<T>> {
  const requestId = generateRequestId();
  const fullRequest: BaseCommunicationRequest = {
    ...request,
    requestId
  };

  return new Promise<BaseCommunicationResponse<T>>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Request timed out: ${request.callerName} (${requestId})`));
    }, timeoutMs);

    pendingRequests.set(requestId, { resolve, reject, timeout });

    sendMessage(fullRequest);
  });
}

function sendMessage(message: any) {
    var stringified = JSON.stringify(message);
    (window.external as any).sendMessage(stringified);
}

function receiveMessage<T>(): Promise<BaseCommunicationResponse<T>> {
  return new Promise(resolve => {
    (window.external as any).receiveMessage((message: string) => {
      resolve(tryParsePayload(message));
    });
  });
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function handleOneWayMessage(response: BaseCommunicationResponse) {
  switch (response.callerName) {
    case "ConfirmClose":
      confirmClose();
      break;
  }
}

function tryParsePayload<T = any>(msg: string): T {
  try {
    return JSON.parse(msg) as T;
  } catch {
    return <T>({});
  }
}