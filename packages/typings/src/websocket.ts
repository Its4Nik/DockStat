import type { log_message } from "./database";

export interface stackSocketMessage {
  topic: "stack";
  data: {
    timestamp: Date;
    message?: string;
    type: "stack-progress" | "stack-error" | "stack-status" | "stack-removed";
    data: stackSocketData;
  };
}

interface stackSocketData {
  stack_id: number;
  message: string;
  action?: string;
  status?: string;
}

type ContainerMsg = {
  topic: "stats";
  data: {
    id: string;
    hostId: number;
    name: string;
    image: string;
    status: string;
    state: string;
    cpuUsage: number;
    memoryUsage: number;
  };
};

type ContainerError = {
  topic: "error";
  data: {
    hostId: number;
    containerId?: string;
    error: string;
  };
};

type LogMsg = {
  topic: "logs";
  data: log_message;
};

export type WSMessage =
  | ContainerMsg
  | ContainerError
  | stackSocketMessage
  | LogMsg;
