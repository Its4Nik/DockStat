import { column } from "@dockstat/sqlite-wrapper"
import type { PluginConfig } from "@dockstat/typings"
import DockMonActions from "./actions"
import type { DockMonTable } from "./types"

export const config: PluginConfig<DockMonTable, typeof DockMonActions> = {
  actions: DockMonActions,
  apiRoutes: {
    // Get all metrics
    "/all": {
      actions: ["getAllMetrics"],
      method: "GET",
    },
    // Get host metrics only
    "/hosts": {
      actions: ["getHostMetrics"],
      method: "GET",
    },
    // Get container metrics only
    "/containers": {
      actions: ["getContainerMetrics"],
      method: "GET",
    },
    // Get latest host metrics (one per host)
    "/hosts/latest": {
      actions: ["getLatestHostMetrics"],
      method: "GET",
    },
    // Get latest container metrics (one per container)
    "/containers/latest": {
      actions: ["getLatestContainerMetrics"],
      method: "GET",
    },
    // Get metrics summary
    "/summary": {
      actions: ["getMetricsSummary"],
      method: "GET",
    },
    // Get dashboard data (combined for frontend)
    "/dashboard": {
      actions: ["getDashboardData"],
      method: "GET",
    },
    // Get metrics for a specific host
    "/host": {
      actions: ["getMetricsByHost"],
      method: "POST",
    },
    // Get metrics for a specific container
    "/container": {
      actions: ["getMetricsByContainer"],
      method: "POST",
    },
    // Get metrics within a time range
    "/range": {
      actions: ["getMetricsInRange"],
      method: "POST",
    },
    // Delete old metrics (cleanup)
    "/cleanup": {
      actions: ["deleteOldMetrics"],
      method: "POST",
    },
    // Test endpoints
    "/test": {
      actions: ["test1", "test2"],
      method: "GET",
    },
  },
  table: {
    columns: {
      id: column.id(),
      type: column.enum(["CONTAINER", "HOST"]),
      host_id: column.integer(),
      docker_client_id: column.integer({ notNull: false }),
      container_id: column.text({ notNull: false }),
      data: column.json(),
      stored_on: column.createdAt(),
    },
    parser: {
      JSON: ["data"],
    },
    name: "dockmon",
  },
  frontend: {
    routes: [
      {
        path: "/dashboard",
        template: {
          id: "dockmon-dashboard",
          name: "DockMon Dashboard",
          description: "Overview of Docker metrics and monitoring data",
          layout: {
            type: "flex",
            direction: "column",
            gap: 16,
            padding: 16,
          },
          state: {
            initial: {
              refreshing: false,
              lastRefresh: null,
            },
          },
          actions: [
            {
              id: "refreshData",
              type: "custom",
              handler: "refreshDashboard",
            },
          ],
          widgets: [
            // Header
            {
              type: "container",
              props: {
                layout: "flex",
                direction: "row",
                justify: "between",
                align: "center",
                className: "mb-4",
              },
              children: [
                {
                  type: "text",
                  props: {
                    text: "DockMon Dashboard",
                    as: "h1",
                    className: "text-2xl font-bold",
                  },
                },
                {
                  type: "button",
                  props: {
                    text: "Refresh",
                    variant: "secondary",
                    action: "refreshData",
                  },
                },
              ],
            },
            // Summary Cards
            {
              type: "container",
              props: {
                layout: "grid",
                columns: 4,
                gap: 16,
                className: "mb-6",
              },
              children: [
                {
                  type: "card",
                  props: {
                    variant: "elevated",
                    size: "sm",
                  },
                  children: [
                    {
                      type: "cardBody",
                      props: {},
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "Total Hosts",
                            className: "text-muted-text text-sm",
                          },
                        },
                        {
                          type: "text",
                          props: {
                            text: "0",
                            as: "div",
                            className: "text-3xl font-bold mt-2",
                          },
                          bindings: {
                            text: "data.summary.totalHosts",
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "card",
                  props: {
                    variant: "elevated",
                    size: "sm",
                  },
                  children: [
                    {
                      type: "cardBody",
                      props: {},
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "Total Containers",
                            className: "text-muted-text text-sm",
                          },
                        },
                        {
                          type: "text",
                          props: {
                            text: "0",
                            as: "div",
                            className: "text-3xl font-bold mt-2",
                          },
                          bindings: {
                            text: "data.summary.totalContainers",
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "card",
                  props: {
                    variant: "elevated",
                    size: "sm",
                  },
                  children: [
                    {
                      type: "cardBody",
                      props: {},
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "Running",
                            className: "text-muted-text text-sm",
                          },
                        },
                        {
                          type: "text",
                          props: {
                            text: "0",
                            as: "div",
                            className: "text-3xl font-bold mt-2 text-green-500",
                          },
                          bindings: {
                            text: "data.summary.totalRunning",
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "card",
                  props: {
                    variant: "elevated",
                    size: "sm",
                  },
                  children: [
                    {
                      type: "cardBody",
                      props: {},
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "Stopped",
                            className: "text-muted-text text-sm",
                          },
                        },
                        {
                          type: "text",
                          props: {
                            text: "0",
                            as: "div",
                            className: "text-3xl font-bold mt-2 text-red-500",
                          },
                          bindings: {
                            text: "data.summary.totalStopped",
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            // Hosts Section
            {
              type: "card",
              props: {
                variant: "default",
              },
              children: [
                {
                  type: "cardHeader",
                  props: {
                    text: "Docker Hosts",
                  },
                },
                {
                  type: "cardBody",
                  props: {},
                  children: [
                    {
                      type: "table",
                      props: {
                        columns: [
                          { key: "hostName", title: "Host Name", sortable: true },
                          { key: "os", title: "OS" },
                          { key: "architecture", title: "Arch" },
                          { key: "dockerVersion", title: "Docker Version" },
                          { key: "containers", title: "Containers", align: "center" },
                          { key: "containersRunning", title: "Running", align: "center" },
                          { key: "images", title: "Images", align: "center" },
                        ],
                        striped: true,
                        hoverable: true,
                        searchable: true,
                        searchPlaceholder: "Search hosts...",
                      },
                      bindings: {
                        data: "data.hosts",
                      },
                    },
                  ],
                },
              ],
            },
            // Containers Section
            {
              type: "card",
              props: {
                variant: "default",
                className: "mt-4",
              },
              children: [
                {
                  type: "cardHeader",
                  props: {
                    text: "Container Metrics",
                  },
                },
                {
                  type: "cardBody",
                  props: {},
                  children: [
                    {
                      type: "table",
                      props: {
                        columns: [
                          { key: "name", title: "Container Name", sortable: true },
                          { key: "state", title: "State" },
                          { key: "cpuUsage", title: "CPU %", align: "right" },
                          { key: "memoryUsage", title: "Memory", align: "right" },
                          { key: "networkRx", title: "Net RX", align: "right" },
                          { key: "networkTx", title: "Net TX", align: "right" },
                        ],
                        striped: true,
                        hoverable: true,
                        searchable: true,
                        searchPlaceholder: "Search containers...",
                      },
                      bindings: {
                        data: "data.containers",
                      },
                    },
                  ],
                },
              ],
            },
          ],
          meta: {
            title: "DockMon Dashboard",
            description: "Monitor Docker hosts and containers",
          },
        },
        meta: {
          title: "Dashboard",
          icon: "LayoutDashboard",
          showInNav: true,
          navOrder: 1,
        },
      },
      {
        path: "/hosts",
        template: {
          id: "dockmon-hosts",
          name: "Host Metrics",
          description: "Detailed host metrics over time",
          layout: {
            type: "flex",
            direction: "column",
            gap: 16,
            padding: 16,
          },
          widgets: [
            {
              type: "text",
              props: {
                text: "Host Metrics History",
                as: "h1",
                className: "text-2xl font-bold mb-4",
              },
            },
            {
              type: "card",
              props: {
                variant: "default",
              },
              children: [
                {
                  type: "cardBody",
                  props: {},
                  children: [
                    {
                      type: "table",
                      props: {
                        columns: [
                          { key: "hostName", title: "Host", sortable: true },
                          { key: "containers", title: "Containers", align: "center" },
                          { key: "containersRunning", title: "Running", align: "center" },
                          { key: "containersStopped", title: "Stopped", align: "center" },
                          { key: "images", title: "Images", align: "center" },
                          { key: "totalMemory", title: "Total Memory", align: "right" },
                          { key: "totalCPU", title: "CPUs", align: "center" },
                          { key: "timestamp", title: "Recorded At", sortable: true },
                        ],
                        striped: true,
                        hoverable: true,
                        searchable: true,
                        size: "sm",
                      },
                      bindings: {
                        data: "data.hostMetrics",
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
      },
      {
        path: "/containers",
        template: {
          id: "dockmon-containers",
          name: "Container Metrics",
          description: "Detailed container metrics over time",
          layout: {
            type: "flex",
            direction: "column",
            gap: 16,
            padding: 16,
          },
          widgets: [
            {
              type: "text",
              props: {
                text: "Container Metrics History",
                as: "h1",
                className: "text-2xl font-bold mb-4",
              },
            },
            {
              type: "card",
              props: {
                variant: "default",
              },
              children: [
                {
                  type: "cardBody",
                  props: {},
                  children: [
                    {
                      type: "table",
                      props: {
                        columns: [
                          { key: "name", title: "Container", sortable: true },
                          { key: "state", title: "State" },
                          { key: "cpuUsage", title: "CPU %", align: "right", sortable: true },
                          { key: "memoryUsage", title: "Memory Used", align: "right" },
                          { key: "memoryLimit", title: "Memory Limit", align: "right" },
                          { key: "networkRx", title: "Network RX", align: "right" },
                          { key: "networkTx", title: "Network TX", align: "right" },
                          { key: "timestamp", title: "Recorded At", sortable: true },
                        ],
                        striped: true,
                        hoverable: true,
                        searchable: true,
                        size: "sm",
                      },
                      bindings: {
                        data: "data.containerMetrics",
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
      },
    ],
    globalState: {
      initial: {
        autoRefresh: true,
        refreshInterval: 30000,
      },
    },
  },
}
