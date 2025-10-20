import { ChartNetwork, Grid, Link, Paintbrush, Plug, Puzzle, Settings, SquareStack, Table2, UploadCloud } from "lucide-react";
import { SiDocker } from "react-icons/si";
import type { NavCard } from "~/components/ui/NavCards";

export const NavItems: NavCard[] = [
  {
    label: "Views",
    bgColorFrom: 'var(--color-navcard-views-from)',
    bgColorTo: 'var(--color-navcard-views-to)',
    textColor: "#ffffff",
    links: [
      {
        label: "Grid View",
        ariaLabel: "DockStat Grid View",
        href: "/views/grid",
        icon: <Grid className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Tables",
        ariaLabel: "DockStat Table View",
        href: "/views/table",
        icon: <Table2 className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Net",
        ariaLabel: "DockStat Net View",
        href: "/views/net",
        icon: <ChartNetwork className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      }
    ]
  },
  {
    label: "Stacks",
    bgColorFrom: "var(--color-navcard-stacks-from)",
    bgColorTo: "var(--color-navcard-stacks-to)",
    textColor: "#ffffff",
    links: [
      {
        label: "Deploy",
        ariaLabel: "Deploy Stack",
        href: "/stacks/deploy",
        icon: <UploadCloud className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Administer",
        ariaLabel: "Administer Deployed Stacks",
        href: "/stacks/admin",
        icon: <Settings className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      }
    ]
  },
  {
    label: "DockStore",
    bgColorFrom: "var(--color-navcard-dockstore-from)",
    bgColorTo: "var(--color-navcard-dockstore-to)",
    textColor: "#ffffff",
    links: [
      {
        label: "Themes",
        ariaLabel: "DockStore Themes",
        href: "/dockstore/themes",
        icon: <Paintbrush className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Plugins",
        ariaLabel: "DockStore Plugins",
        href: "/dockstore/plugins",
        icon: <Puzzle className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Stacks",
        ariaLabel: "DockStore Stacks",
        href: "/dockstore/stacks",
        icon: <SquareStack className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      }
    ]
  },
  {
    label: "Configuration",
    bgColorFrom: "#061A40",
    bgColorTo: "#003559",
    textColor: "#ffffff",
    links: [
      {
        label: "Adapters",
        ariaLabel: "Configure DockStat Adapters",
        href: "/adapters",
        icon: <Plug className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Docker",
        ariaLabel: "DockStat - Configure Docker",
        href: "/configure/docker",
        icon: <SiDocker className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      },
      {
        label: "Quick Links",
        ariaLabel: "Setup quick links",
        href: "/configure#links",
        icon: <Link className="nav-card-link-icon shrink-0 w-4 h-4" aria-hidden="true" />
      }
    ]
  }
] as const;
