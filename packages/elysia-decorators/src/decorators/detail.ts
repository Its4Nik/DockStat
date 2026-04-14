import type { DocumentDecoration } from "elysia";
import { updateConfig } from "../utils/config";

export const Detail = (detail:DocumentDecoration) => updateConfig('detail', detail);
