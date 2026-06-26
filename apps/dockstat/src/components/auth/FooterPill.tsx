import { SiGithub } from "@icons-pack/react-simple-icons"
import { Book, Scale } from "lucide-react"

export const FooterPill = ({ errored }: { errored: boolean }) => {
  return (
    <div className="w-full h-10 flex fixed bottom-5">
      <div className="mx-auto relative">
        {/* Glow background */}
        <div
          className={`absolute  inset-0 blur-xl transition-colors duration-300 ${errored ? "bg-error" : "bg-accent"} opacity-40 rounded-full`}
        ></div>

        {/* Content */}
        <div
          className={`relative flex justify-between transition-colors duration-300 ${errored ? "text-error" : "text-accent"} w-40 px-4 py-2 rounded-full bg-background`}
        >
          <SiGithub />
          <Book />
          <Scale />
        </div>
      </div>
    </div>
  )
}
