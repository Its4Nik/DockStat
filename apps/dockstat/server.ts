import { createRequestHandler } from "@react-router/express";
import express from "express";
import morgan from "morgan";

const app = express();
app.use(express.static("build/client"));
app.use(express.static("public"));
app.use(morgan("combined"));

app.use(
	createRequestHandler({
		// @ts-expect-error: Any import
		build: await import("./build/server/index.js"),
	}),
);

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
