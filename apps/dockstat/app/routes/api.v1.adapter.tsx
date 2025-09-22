import type { ActionFunctionArgs } from "react-router";
import ServerInstance from "~/.server";

const AH = ServerInstance.getAdapterHandler()
const logger = ServerInstance.getLogger()

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = String(form.get("intent"));

  logger.info(`Intent: ${intent}`)

  // Adapter Actions
  switch (intent) {
    // Creating a new adapter
    case "new": {
      const type = String(form.get("type"));

      if (!type) {
        return new Response("Type is required", { status: 400 });
      }

      switch (type) {
        case "docker": {
          const name = String(form.get("name"));
          const options = JSON.parse(String(form.get("options")));
          AH.registerDockerAdapter(name, options)
        }
          return new Response("Adapter created", { status: 201 });
        default:
          return new Response("Invalid type", { status: 400 });
      }
    }
    case "remove": {
      const name = String(form.get("name"));
      AH.unregisterDockerAdapter(name);
      return new Response("Adapter removed", { status: 200 });
    }
    default:
      return new Response("Invalid intent", { status: 400 });
  }
}
