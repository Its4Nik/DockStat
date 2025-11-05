import { Box, Github, Hand, Layers, LockIcon, PlaneTakeoff, Puzzle, ShoppingBag, Store, Zap } from "lucide-react";
import { HoverBubble } from "../components/HoverBubble/HoverBubble";
import { LinkWithIcon } from "../components/Link/Link";
import { Badge } from "../components/Badge/Badge";
import type { Slide } from "./types";
import { Divider } from "../components/Divider/Divider";

export const slides: Slide[] = [
  {
    title: "Welcome to DockStat",
    subtitle: "Next-gen container management and orchestration — modular, extensible, TS-first.",
    icon: <Hand className="w-10 h-10 animate-wave rotate-45" />,
    bullets: [
      { title: "Plugin-first design", desc: "Extend everything: deployers, notifiers, themes. The only limit is your imagination!" },
      { title: "Modern JS/TS ecosystem", desc: "Use the huge library ecosystem without limits." },
      { title: "DockStore", desc: "Browse Stacks, Plugins and Themes from the store." },
    ],
    footer: (
      <div className="space-y-2">
        <LinkWithIcon icon={<Puzzle />} href="https://github.com/its4nik/dockstat">Plugin Development</LinkWithIcon>
        <LinkWithIcon icon={<ShoppingBag />} href="https://dockstore.itsnik.de">Browse</LinkWithIcon>
      </div>
    )
  },
  {
    title: "DockStacks",
    subtitle: "One-click deployments of compose-like stacks.",
    icon: <Layers className="w-10 h-10" />,
    bullets: [
      { title: "Templating format", desc: "Translate to/from Docker Compose easily." },
      { title: "One-click deploy", desc: "Deploy stacks to DockNodes via handlers." },
      { title: "Flexible mounts", desc: "Control managed vs custom mount paths." },
    ],
  },
  {
    title: "DockStat × Zoraxy",
    subtitle: "A modern alternative to Nginx Proxy Manager.",
    icon: <LockIcon className="w-10 h-10" />,
    bullets: [
      { title: "Automatic subdomains", desc: "Auto-create based on container_name." },
      { title: "One-click deploy", desc: "Deploy Zoraxy to a host and manage proxies visually." },
      { title: "Integrations", desc: "Works with DockStacks and the DockStore." },
    ],
    footer: <p>Zoraxy is a newer alternative, written in GO, to Nginx-Proxy-Manager or Traeffik</p>,
  },
  {
    title: "DockStack Migrator",
    subtitle: "Migrate existing containers into DockStacks-managed stacks.",
    icon: <PlaneTakeoff className="w-10 h-10" />,
    bullets: [
      { title: "Read metadata", desc: "Generates docker-compose files from host containers." },
      { title: "Mount handling", desc: "Keep mounts or optionally copy data to managed paths." },
      { title: "Fast onboarding", desc: "Migrate hosts to DockStat in minutes." },
    ],
  },
  {
    title: "DockStore & Next Steps",
    subtitle: "Browse Stacks, Plugins, and Themes — install with a click.",
    icon: <Store className="w-10 h-10" />,
    bullets: [
      { title: "Discover", desc: "Find ready-made stacks and plugins." },
      { title: "Install", desc: "One-click install to your DockNode clusters." },
      { title: "Contribute", desc: "Publish plugins and themes to DockStore." },
    ],
    footer: (
      <div className="space-y-1">
        <div className="flex gap-2 items-center">
          <HoverBubble label="github.com/its4nik/dockstat">
            <LinkWithIcon href="https://github.com/its4nik/dockstat" icon={<Github />} iconPosition="left">
              <span className="text-sm">Contribute plugins & themes</span>
              <Badge variant="success" className="ml-2" outlined>Open Source</Badge>
            </LinkWithIcon>
          </HoverBubble>
        </div>
        <Divider label="Next Steps" variant="dashed" />
        <div className="flex flex-col flex-2 gap-2">
          <Badge outlined>
            Deploy Your First Stack
          </Badge>
          <Badge outlined>
            Setup Hosts to Monitor
          </Badge>
        </div>
      </div>
    ),
  },
];
