import { WrappedPluginMeta } from "@dockstat/typings/schemas"
import Ajv from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export const validateMeta = ajv.compile(WrappedPluginMeta)
export { ajv }
