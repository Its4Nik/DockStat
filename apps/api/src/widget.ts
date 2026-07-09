import { WidgetsService as WidgetsServiceFactory } from "widgets/server";
import { DockStatDB } from "./database";
import BaseLogger from "./logger";
import { verifyAuthToken } from "@dockstat/auth";

const wsTokenVerifier = async (token: string) => {
  const payload = await verifyAuthToken(token)
  return (payload?.user as Record<string, unknown>) ?? null
}

export const WidgetsService = new WidgetsServiceFactory(
  DockStatDB._sqliteWrapper,
  BaseLogger,
  {
    requireAuth: true,
    verifyToken: wsTokenVerifier,
  }
)
