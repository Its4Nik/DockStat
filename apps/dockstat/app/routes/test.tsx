import { useLoaderData } from "react-router";
import { api } from "~/.server/treaty";

export const loader = async () => {
  return await api.db["dockstat-config"].get()
};

export default function Test() {
  const { data } = useLoaderData<typeof loader>()
  return (
    <main>
      test
      <span>
        {data}
      </span>
    </main>
  );
}
