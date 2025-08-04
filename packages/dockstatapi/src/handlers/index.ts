import { ApiHandler } from "./config";
import { DatabaseHandler } from "./database";
import { BasicDockerHandler } from "./docker";
import { LogHandler } from "./logs";
import { Starter } from "./modules/starter";
import { StackHandler } from "./stacks";
import { StoreHandler } from "./store";
import { ThemeHandler } from "./themes";
import { CheckHealth } from "./utils";

export const handlers = {
  BasicDockerHandler,
  ApiHandler,
  DatabaseHandler,
  StackHandler,
  LogHandler,
  CheckHealth,
  Socket: "ws://localhost:4837/ws",
  StoreHandler,
  ThemeHandler,
};

Starter.startAll();
