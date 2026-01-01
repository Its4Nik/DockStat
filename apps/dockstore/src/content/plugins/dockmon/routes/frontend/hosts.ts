import { createFrontendRoute } from "@dockstat/plugin-builder"

export const HostsRoute = createFrontendRoute({
  path: "/hosts",
  loaders: [
    {
      id: "hostMetrics",
      apiRoute: "/hosts/latest",
      method: "GET",
      dataKey: "hostMetrics",
    },
  ],
  actions: [
    {
      id: "refreshHosts",
      type: "reload",
      loaderIds: ["hostMetrics"],
      showLoading: true,
    },
  ],
  template: {
    id: "dockmon-hosts",
    name: "Host Metrics",
    description: "Detailed host metrics over time",
    layout: {
      type: "flex",
      direction: "column",
      gap: 24,
    },
    widgets: [
      // Header Row
      {
        type: "container",
        props: {
          layout: "flex",
          direction: "row",
          justify: "between",
          align: "center",
          className: "flex-wrap gap-4",
        },
        children: [
          {
            type: "container",
            props: {
              layout: "flex",
              direction: "column",
            },
            children: [
              {
                type: "text",
                props: {
                  text: "🖥️ Host Metrics",
                  as: "h1",
                  className: "text-2xl font-bold text-primary-text",
                },
              },
              {
                type: "text",
                props: {
                  text: "Monitor your Docker hosts performance and resource usage",
                  as: "p",
                  className: "text-sm text-muted-text mt-1",
                },
              },
            ],
          },
          {
            type: "button",
            props: {
              text: "🔄 Refresh",
              variant: "secondary",
              action: "refreshHosts",
            },
          },
        ],
      },
      // Divider
      {
        type: "divider",
        props: {
          variant: "default",
        },
      },
      // Main Table Card
      {
        type: "card",
        props: {
          variant: "elevated",
          className: "overflow-hidden",
        },
        children: [
          {
            type: "cardBody",
            props: {
              className: "p-0",
            },
            children: [
              {
                type: "table",
                props: {
                  columns: [
                    { key: "hostName", title: "Host Name", sortable: true },
                    { key: "os", title: "Operating System" },
                    { key: "architecture", title: "Architecture" },
                    { key: "dockerVersion", title: "Docker Version" },
                    { key: "containers", title: "Total", align: "center" },
                    {
                      key: "containersRunning",
                      title: "Running",
                      align: "center",
                    },
                    {
                      key: "containersStopped",
                      title: "Stopped",
                      align: "center",
                    },
                    { key: "images", title: "Images", align: "center" },
                    {
                      key: "totalMemory",
                      title: "Total Memory",
                      align: "right",
                    },
                    { key: "totalCPU", title: "CPUs", align: "center" },
                  ],
                  striped: true,
                  hoverable: true,
                  searchable: true,
                  searchPlaceholder: "Search hosts...",
                  size: "md",
                },
                bindings: {
                  data: "hostMetrics",
                },
              },
            ],
          },
        ],
      },
    ],
    meta: {
      title: "Host Metrics",
    },
  },
  meta: {
    title: "Hosts",
    icon: "Server",
    showInNav: true,
    navOrder: 2,
  },
})
