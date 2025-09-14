import {
  Form,
  useLoaderData,
  useActionData,
  type ActionFunctionArgs,
} from "react-router";
import ServerInstance from "~/server/server.index";

export async function action({ request }: ActionFunctionArgs) {
  console.log("Action performed!");
  console.log("Request:", request);
  console.log("Headers:", request.headers);

  const DBSchema = ServerInstance.getDB().DB.getSchema();
  const AdapterTable = ServerInstance.getDB().tables.adapter.select(["*"]).all()
  return {
    configs: {
      adapters: AdapterTable,
      schema: DBSchema,
    },
  };
}

export function loader() {
  return ServerInstance.getDB().tables.config.select(["*"]).all();
}

export default function TestRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div>
      <div className="flex w-full h-full bg-slate-800"/>

      <div className="flex flex-col flex-1/12">
        <Form method="post">
          <button
            type="submit"
            className="p-1 rounded-md m-4 bg-slate-500 hover:cursor-pointer"
          >
            Button
          </button>
        </Form>

        <div className="flex flex-col flex-1/12">
          <span>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(loaderData, null, 2)}
            </pre>
          </span>

          <div>
            <strong>Action result:</strong>{" "}
            <pre className="whitespace-pre-wrap">
              {actionData ? JSON.stringify(actionData, null, 2) : "none"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
