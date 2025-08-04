import packageJson from "../../../package.json";

const { version, description, license, dependencies, devDependencies } =
	packageJson;
let { contributors } = packageJson;

const authorName = packageJson.author.name;
const authorEmail = packageJson.author.email;
const authorWebsite = packageJson.author.url;

if (contributors.length === 0) {
	contributors = [":(" as never];
}

export {
	version,
	description,
	authorName,
	authorEmail,
	authorWebsite,
	license,
	contributors,
	dependencies,
	devDependencies,
};
