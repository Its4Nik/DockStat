import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta() {
  return [
    { title: 'New React Router + ElysiaJS App' },
    { name: "description", content: "Welcome to React Router + ElysiaJS" },
  ];
}

export default function Home() {
  return <Welcome />;
}
