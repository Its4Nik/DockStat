//import { useLoaderData } from 'react-router'
import { Button, Card, CardBody, CardFooter, CardHeader } from "@dockstat/ui"
import { api } from "~/.server/treaty"
import { useState } from "react"

export const loader = async () => {
	return await api.db["dockstat-config"].get()
}

export default function Test() {
	//const {} = useLoaderData<typeof loader>()
	const [vars, setVars] = useState<Record<string, string>>({})

	const getTailwindVariables = () => {
		const styles = getComputedStyle(document.documentElement)
		const vars: Record<string, string> = {}
		for (let i = 0; i < styles.length; i++) {
			const name = styles[i]
			if (name.startsWith("--")) {
				vars[name] = styles.getPropertyValue(name).trim()
			}
		}
		setVars(vars)
	}

	return (
		<main className="p-4">
			<Card>
				<CardHeader className="text-success">Tailwind Variables</CardHeader>
				<CardBody>
					<pre className="text-xs whitespace-pre-wrap">
						{JSON.stringify(vars, null, 2)}
					</pre>
				</CardBody>
				<CardFooter>
					<Button onClick={getTailwindVariables}>
						{Object.keys(vars).length
							? "Reload Variables"
							: "Get CSS Variables"}
					</Button>
				</CardFooter>
			</Card>
		</main>
	)
}
