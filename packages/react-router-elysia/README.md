# React Router × ElysiaJS Template

A modern template for building **React Router v7** applications backed by an **ElysiaJS** API layer.

This setup bridges the gap between frontend routing and a high-performance Bun-powered backend, giving you full-stack type safety and speed — all with minimal configuration.

> ⚠️ Note: Native ElysiaJS WebSockets aren’t currently supported in this template, but a practical workaround example is included.

---

## 🚀 Getting Started

To bootstrap a new project using this template (Bun required):

```bash
bun create react-router@latest --template its4nik/dockstat/packages/react-router-elysia
bun run dev
```

Your app will start with a prewired Elysia backend and a fully functional React Router setup.

---

## 💡 Why Pair ElysiaJS with React Router?

ElysiaJS brings:

* 🧠 **Type Safety** – Full end-to-end typings with effortless validation
* ⚡ **Performance** – Built for Bun with extreme efficiency
* 🧩 **Simplicity** – Intuitive API design that complements React Router’s data APIs
* 🧱 **Extensibility** – Powerful plugins and middleware for authentication, logging, and more

React Router handles client-side routing beautifully — but Elysia fills in the backend gap with type-safe routes, validation, and schema inference. Together, they make an elegant, cohesive full-stack setup.
