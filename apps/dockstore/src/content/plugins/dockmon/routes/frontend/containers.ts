import { createFrontendRoute } from "@dockstat/plugin-builder"

export const ContainersRoute = createFrontendRoute({
  path: "/containers",
  loaders: [
    {
      id: "containerMetrics",
      apiRoute: "/containers/latest",
      method: "GET",
      dataKey: "containerMetrics",
    },
  ],
  actions: [
    {
      id: "refreshContainers",
      type: "reload",
      loaderIds: ["containerMetrics"],
      showLoading: true,
    },
  ],
  template: {
    id: "dockmon-containers",
    name: "Container Metrics",
    description: "Detailed container metrics over time",
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
                  text: "📦 Container Metrics",
                  as: "h1",
                  className: "text-2xl font-bold text-primary-text",
                },
              },
              {
                type: "text",
                props: {
                  text: "Monitor container resource usage and performance",
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
              action: "refreshContainers",
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
                    { key: "name", title: "Container Name", sortable: true },
                    { key: "state", title: "State" },
                    {
                      key: "cpuUsage",
                      title: "CPU %",
                      align: "right",
                      sortable: true,
                    },
                    {
                      key: "memoryUsage",
                      title: "Memory Used",
                      align: "right",
                    },
                    {
                      key: "memoryLimit",
                      title: "Memory Limit",
                      align: "right",
                    },
                    { key: "networkRx", title: "Network RX", align: "right" },
                    { key: "networkTx", title: "Network TX", align: "right" },
                  ],
                  striped: true,
                  hoverable: true,
                  searchable: true,
                  searchPlaceholder: "Search containers...",
                  size: "md",
                },
                bindings: {
                  data: "containerMetrics",
                },
              },
            ],
          },
        ],
      },
    ],
    meta: {
      title: "Container Metrics",
    },
  },
  meta: {
    title: "Containers",
    icon: "Container",
    showInNav: true,
    navOrder: 3,
  },
})
