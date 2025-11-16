import { type RouteConfig, route } from "@react-router/dev/routes";
//import { flatRoutes } from "@react-router/fs-routes";

export default [
	route("/test", "./routes/test.tsx"),
	route("/plugins", "./routes/plugins.tsx"),
	route("/api/*", "./routes/proxy.tsx"),
	route("/extensions", "./routes/extensions.tsx"),
] satisfies RouteConfig;
