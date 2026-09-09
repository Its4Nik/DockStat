import { Schemas } from "../schemas"
import type { withValidation } from "../middleware/withValidation"

type RS<T> = Record<string, T>

export type GenericSchema = RS<RS<ReturnType<typeof withValidation>>> | {
  /**
   * Ignored by the routes generator
   */
  ignoredGroups: string[]
}


const exPc = (mw: boolean, content: string) => String(`export const ${mw ? "middleware: Route.MiddlewareFunction[]" : "action: ActionFunction"} = ${mw ? '[' : ''}Schemas.${content}${mw ? '.middleware]' : '.action'};`)

async function typeGen() {
  if (Bun.env.NODE_ENV === "production") {
    console.log("Running: NODE_ENV is", Bun.env.NODE_ENV)
    return
  }

  const appDir = String(__dirname.match(/.*\.server/g)?.[0]).replace("/.server", "")

  const write = async (filePath: string, dat: string) => {
    console.log("Writing File:", filePath)
    await Bun.write(appDir + "/" + filePath, dat)
    console.log("Done")
  }

  console.log("App dir:", appDir)

  const S = Schemas as GenericSchema

  const indexes: string[] = []
  const actionIndexes: string[] = []

  for (const [cat, Group] of Object.entries(S)) {
    for (const gKey of Object.keys(Group)) {
      if (
        Array.isArray(S.ignoredGroups) &&
        S.ignoredGroups.includes(`${cat}.${gKey}`)
      ) continue

      indexes.push(`${cat}.${gKey}`)
      console.log("Group:", `${cat}.${gKey}`)

      for (const aKey of Object.keys(Group[gKey]["_ops"])) {
        console.log("ActionK:", aKey)
        actionIndexes.push(`${cat}.${gKey}.${aKey}`)
      }

      const fileName = `${cat}.${gKey}`

      const imports =
        `import type { Route } from "./+types/${fileName.toLowerCase()}"\n` +
        `import { Schemas } from "~/.server/schemas"\n` +
        `import type { ActionFunction } from "react-router"\n\n`

      const code =
        exPc(true, fileName) + "\n" +
        exPc(false, fileName)

      await write(`routes/gen/${fileName.toLowerCase()}.tsx`, imports + code)
    }
  }

  const indexExport = `import { route } from "@react-router/dev/routes"

const GeneratedRoutes = [${indexes.map(i => `route("${i.toLowerCase().replaceAll(".", "/")}", "routes/gen/${i.toLowerCase()}.tsx")`).join(", ")}]

export default GeneratedRoutes
`

  await write("routes/gen/index.tsx", indexExport)



  // Lib api helper gen

  const code = `import { submit } from "~/lib/submit"
import type { Schemas as ServerSchemas } from "~/.server/schemas"

export const executeAction = {
${actionIndexes.map((i) => `\t"${i.toLowerCase()}": submit<typeof ServerSchemas.${i.match(/^.+(?=\.[^.]+$)/g)?.[0]}._ops>("${i.match(/\.([^.]+)$/g)?.[0].replaceAll(".", "")}","/api/v3/${i.match(/^.+(?=\.[^.]+$)/g)?.[0].replaceAll(".", "/").toLowerCase()}")`).join(",\n")}
}`

  await write("lib/executeAction.ts", code)
}

await typeGen()

process.exit(0)
