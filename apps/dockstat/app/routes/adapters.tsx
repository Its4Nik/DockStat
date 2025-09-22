import type { AdapterTable } from "@dockstat/typings";
import { useLoaderData } from "react-router";
import ServerInstance from "~/.server";
import AdapterCard from "~/components/ui/AdapterCard";

const AH = ServerInstance.getAdapterHandler();

export function loader() {
  const adapters = AH.getAdapterTable().select(["*"]).all();
  return adapters;
}

export default function Adapters() {
  const loaderData = useLoaderData<AdapterTable[]>();

  return (
    <AdapterCard adapters={loaderData} />
  );
}
