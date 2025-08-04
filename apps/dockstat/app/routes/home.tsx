import { Welcome } from "../welcome/welcome";
import { BasicDockerHandler } from "dockstatapi";
import { Stack } from "dockstat-typings";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
