import { Link } from "react-router"
import { Badge } from "../Badge/Badge"
import { Card } from "../Card/Card"
import DockStatLogo from "./DockStat2-06.png"
import { Divider } from "../Divider/Divider"

type NavbarProps = {
	isNavigating: boolean
	location: unknown
}

const paths: Array<{ slug: string; path: string }> = [
	{
		slug: "Extensions",
		path: "/extensions",
	},
	{
		slug: "Plugins",
		path: "/plugins",
	},
]

export function Navbar({ isNavigating, location }: NavbarProps) {
	return (
		<>
			<Card size="sm" className="w-full p-0 mb-4 relative overflow-hidden">
				{/* Animated gradient background */}
				<div
					className={`absolute inset-0 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-size-[200%_200%] transition-opacity duration-500 ${
						isNavigating
							? "opacity-20 animate-[gradient_1s_ease_infinite]"
							: "opacity-0"
					}`}
					style={{
						animation: isNavigating ? "gradient 3s ease infinite" : "none",
					}}
				/>

				<nav className="flex items-center justify-between relative z-10">
					<img
						src={DockStatLogo}
						alt="DockStat Logo"
						className="w-7 shrink-0"
					/>

					<div className="flex items-center gap-2">
						{paths.map((p) => {
							const isCurrently = p.path === location

							return (
								<Link to={p.path} key={`${p.slug}-${isCurrently}-link`}>
									<Badge
										key={`${p.slug}-${isCurrently}-badge`}
										outlined={isCurrently}
									>
										{p.slug}
									</Badge>
								</Link>
							)
						})}
					</div>
				</nav>

				<style>{`
				@keyframes gradient {
					0% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
					100% { background-position: 0% 50%; }
				}
			`}</style>
			</Card>
			<Divider variant="dashed" className="my-4" />
		</>
	)
}
