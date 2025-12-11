import { Welcome } from "../welcome/welcome"
import type { Route } from "./+types/home"

export function meta() {
  return [
    { title: "New React Router + ElysiaJS App" },
    { name: "description", content: "Welcome to React Router + ElysiaJS" },
  ]
}

export default function Home() {
  return <Welcome />
}
