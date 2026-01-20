import { extname } from "node:path"
import { Command } from "@commander-js/extra-typings"
import { contentType } from "../utils/contentType"

export const serveCommand = new Command("serve")
  .description(
    "Serves the current working directory via Bun.serve - Really rudimentair and only recommended for testing or for deployments behind a reverse proxy"
  )
  .option("-p, --port <port>", "The port on which the server should listen", "8080")
  .action(async (options) => {
    Bun.serve({
      port: options.port,
      async fetch(req) {
        const url = new URL(req.url)

        console.log("Received request:", req.url)

        let filePath = decodeURIComponent(url.pathname)

        filePath = filePath.replaceAll("../", "/")

        if (filePath.charAt(0) === "/") {
          filePath = filePath.replace("/", "")
        }

        console.debug("File Path:", filePath)

        const file = Bun.file(filePath)
        if (!(await file.exists())) {
          return new Response("Not found", { status: 404 })
        }

        return new Response(file, {
          headers: {
            "Content-Type": contentType(extname(filePath)),
          },
        })
      },
    })
  })
