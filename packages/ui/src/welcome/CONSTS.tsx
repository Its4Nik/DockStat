import {
  Github,
  Hand,
  Layers,
  LockIcon,
  PlaneTakeoff,
  Puzzle,
  ShoppingBag,
  Store,
} from "lucide-react"
import { Badge } from "../components/Badge/Badge"
import { Divider } from "../components/Divider/Divider"
import { HoverBubble } from "../components/HoverBubble/HoverBubble"
import { LinkWithIcon } from "../components/Link/Link"
import type { Slide } from "./types"

export const slides: Slide[] = [
  {
    bullets: [
      {
        desc: "Extend everything: deployers, notifiers, themes. The only limit is your imagination!",
        title: "Plugin-first design",
      },
      { desc: "Use the huge library ecosystem without limits.", title: "Modern JS/TS ecosystem" },
      { desc: "Browse Stacks, Plugins and Themes from the store.", title: "DockStore" },
    ],
    footer: (
      <div className="space-y-2">
        <LinkWithIcon
          href="https://github.com/its4nik/dockstat"
          icon={<Puzzle />}
        >
          Plugin Development
        </LinkWithIcon>
        <LinkWithIcon
          href="https://dockstore.itsnik.de"
          icon={<ShoppingBag />}
        >
          Browse
        </LinkWithIcon>
      </div>
    ),
    icon: <Hand className="w-10 h-10 animate-wave rotate-45" />,
    subtitle: "Next-gen container management and orchestration — modular, extensible, TS-first.",
    title: "Welcome to DockStat",
  },
  {
    bullets: [
      { desc: "Translate to/from Docker Compose easily.", title: "Templating format" },
      { desc: "Deploy stacks to DockNodes via handlers.", title: "One-click deploy" },
      { desc: "Control managed vs custom mount paths.", title: "Flexible mounts" },
    ],
    icon: <Layers className="w-10 h-10" />,
    subtitle: "One-click deployments of compose-like stacks.",
    title: "DockStacks",
  },
  {
    bullets: [
      { desc: "Auto-create based on container_name.", title: "Automatic subdomains" },
      { desc: "Deploy Zoraxy to a host and manage proxies visually.", title: "One-click deploy" },
      { desc: "Works with DockStacks and the DockStore.", title: "Integrations" },
    ],
    footer: <p>Zoraxy is a newer alternative, written in GO, to Nginx-Proxy-Manager or Traeffik</p>,
    icon: <LockIcon className="w-10 h-10" />,
    subtitle: "A modern alternative to Nginx Proxy Manager.",
    title: "DockStat × Zoraxy",
  },
  {
    bullets: [
      { desc: "Generates docker-compose files from host containers.", title: "Read metadata" },
      { desc: "Keep mounts or optionally copy data to managed paths.", title: "Mount handling" },
      { desc: "Migrate hosts to DockStat in minutes.", title: "Fast onboarding" },
    ],
    icon: <PlaneTakeoff className="w-10 h-10" />,
    subtitle: "Migrate existing containers into DockStacks-managed stacks.",
    title: "DockStack Migrator",
  },
  {
    bullets: [
      { desc: "Find ready-made stacks and plugins.", title: "Discover" },
      { desc: "One-click install to your DockNode clusters.", title: "Install" },
      { desc: "Publish plugins and themes to DockStore.", title: "Contribute" },
    ],
    footer: (
      <div className="space-y-1">
        <div className="flex gap-2 items-center">
          <HoverBubble label="github.com/its4nik/dockstat">
            <LinkWithIcon
              href="https://github.com/its4nik/dockstat"
              icon={<Github />}
              iconPosition="left"
            >
              <span className="text-sm">Contribute plugins & themes</span>
              <Badge
                className="ml-2"
                outlined
                variant="success"
              >
                Open Source
              </Badge>
            </LinkWithIcon>
          </HoverBubble>
        </div>
        <Divider
          label="Next Steps"
          variant="dashed"
        />
        <div className="flex flex-col flex-2 gap-2">
          <Badge outlined>Deploy Your First Stack</Badge>
          <Badge outlined>Setup Hosts to Monitor</Badge>
        </div>
      </div>
    ),
    icon: <Store className="w-10 h-10" />,
    subtitle: "Browse Stacks, Plugins, and Themes — install with a click.",
    title: "DockStore & Next Steps",
  },
]
