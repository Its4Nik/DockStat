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
      // ==================== DASHBOARD PAGE ====================
      {
        path: "/dashboard",
        loaders: [
          {
            id: "dashboardData",
            apiRoute: "/dashboard",
            method: "GET",
            dataKey: "dashboard",
          },
          {
            id: "metricsSummary",
            apiRoute: "/summary",
            method: "GET",
            dataKey: "summary",
          },
        ],
        actions: [
          {
            id: "refreshData",
            type: "reload",
            loaderIds: ["dashboardData", "metricsSummary"],
            showLoading: true,
          },
          {
            id: "cleanupOldMetrics",
            type: "api",
            apiRoute: "/cleanup",
            method: "POST",
            body: { olderThanDays: 7 },
            confirm: {
              message: "Are you sure you want to delete metrics older than 7 days?",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
            onSuccess: {
              notify: {
                message: "Old metrics cleaned up successfully",
                type: "success",
              },
              triggerAction: "refreshData",
            },
            onError: {
              notify: {
                message: "Failed to cleanup old metrics",
                type: "error",
              },
            },
          },
        ],
        template: {
          id: "dockmon-dashboard",
          name: "DockMon Dashboard",
          description: "Overview of Docker metrics and monitoring data",
          layout: {
            type: "flex",
            direction: "column",
            gap: 24,
          },
          state: {
            initial: {
              refreshing: false,
            },
          },
          widgets: [
            // ==================== STATS BAR ====================
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
                // Total Hosts Card
                {
                  type: "card",
                  props: {
                    variant: "outlined",
                    size: "sm",
                    className: "min-w-35",
                  },
                  children: [
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        align: "center",
                        gap: 8,
                      },
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "🖥️",
                            className: "text-xl text-secondary-text",
                          },
                        },
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
                                text: "HOSTS",
                                className:
                                  "text-xs text-muted-text uppercase tracking-wide font-medium",
                              },
                            },
                            {
                              type: "text",
                              props: {
                                text: "0",
                                as: "span",
                                className: "text-xl font-semibold text-secondary-text",
                              },
                              bindings: {
                                text: "dashboard.summary.totalHosts",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Divider
                {
                  type: "divider",
                  props: {
                    variant: "dotted",
                    className: "w-10! my-auto hidden md:block",
                  },
                },
                // Total Containers Card
                {
                  type: "card",
                  props: {
                    variant: "outlined",
                    size: "sm",
                    className: "min-w-35",
                  },
                  children: [
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        align: "center",
                        gap: 8,
                      },
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "📦",
                            className: "text-xl text-secondary-text",
                          },
                        },
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
                                text: "CONTAINERS",
                                className:
                                  "text-xs text-muted-text uppercase tracking-wide font-medium",
                              },
                            },
                            {
                              type: "text",
                              props: {
                                text: "0",
                                as: "span",
                                className: "text-xl font-semibold text-secondary-text",
                              },
                              bindings: {
                                text: "dashboard.summary.totalContainers",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Divider
                {
                  type: "divider",
                  props: {
                    variant: "dotted",
                    className: "w-10! my-auto hidden md:block",
                  },
                },
                // Running Containers Card
                {
                  type: "card",
                  props: {
                    variant: "outlined",
                    size: "sm",
                    className: "min-w-35",
                  },
                  children: [
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        align: "center",
                        gap: 8,
                      },
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "▶️",
                            className: "text-xl",
                          },
                        },
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
                                text: "RUNNING",
                                className:
                                  "text-xs text-muted-text uppercase tracking-wide font-medium",
                              },
                            },
                            {
                              type: "text",
                              props: {
                                text: "0",
                                as: "span",
                                className: "text-xl font-semibold text-green-500",
                              },
                              bindings: {
                                text: "dashboard.summary.totalRunning",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Divider
                {
                  type: "divider",
                  props: {
                    variant: "dotted",
                    className: "w-10! my-auto hidden md:block",
                  },
                },
                // Stopped Containers Card
                {
                  type: "card",
                  props: {
                    variant: "outlined",
                    size: "sm",
                    className: "min-w-35",
                  },
                  children: [
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        align: "center",
                        gap: 8,
                      },
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "⏹️",
                            className: "text-xl",
                          },
                        },
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
                                text: "STOPPED",
                                className:
                                  "text-xs text-muted-text uppercase tracking-wide font-medium",
                              },
                            },
                            {
                              type: "text",
                              props: {
                                text: "0",
                                as: "span",
                                className: "text-xl font-semibold text-red-500",
                              },
                              bindings: {
                                text: "dashboard.summary.totalStopped",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Divider
                {
                  type: "divider",
                  props: {
                    variant: "dotted",
                    className: "w-10! my-auto hidden md:block",
                  },
                },
                // Images Card
                {
                  type: "card",
                  props: {
                    variant: "outlined",
                    size: "sm",
                    className: "min-w-35",
                  },
                  children: [
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        align: "center",
                        gap: 8,
                      },
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "🖼️",
                            className: "text-xl text-secondary-text",
                          },
                        },
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
                                text: "IMAGES",
                                className:
                                  "text-xs text-muted-text uppercase tracking-wide font-medium",
                              },
                            },
                            {
                              type: "text",
                              props: {
                                text: "0",
                                as: "span",
                                className: "text-xl font-semibold text-secondary-text",
                              },
                              bindings: {
                                text: "dashboard.summary.totalImages",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Divider
                {
                  type: "divider",
                  props: {
                    variant: "dotted",
                    className: "w-10! my-auto hidden md:block",
                  },
                },
                // Metrics Collected Card
                {
                  type: "card",
                  props: {
                    variant: "outlined",
                    size: "sm",
                    className: "min-w-35",
                  },
                  children: [
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        align: "center",
                        gap: 8,
                      },
                      children: [
                        {
                          type: "text",
                          props: {
                            text: "📊",
                            className: "text-xl text-secondary-text",
                          },
                        },
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
                                text: "METRICS",
                                className:
                                  "text-xs text-muted-text uppercase tracking-wide font-medium",
                              },
                            },
                            {
                              type: "text",
                              props: {
                                text: "0",
                                as: "span",
                                className: "text-xl font-semibold text-secondary-text",
                              },
                              bindings: {
                                text: "dashboard.summary.metricsCollected",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            // ==================== DIVIDER ====================
            {
              type: "divider",
              props: {
                variant: "default",
                className: "my-2",
              },
            },
            // ==================== ACTION BUTTONS (Slides style) ====================
            {
              type: "card",
              props: {
                variant: "elevated",
                size: "sm",
                className: "p-4",
              },
              children: [
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
                      type: "text",
                      props: {
                        text: "Quick Actions",
                        as: "h3",
                        className: "text-lg font-semibold text-primary-text",
                      },
                    },
                    {
                      type: "container",
                      props: {
                        layout: "flex",
                        direction: "row",
                        gap: 12,
                      },
                      children: [
                        {
                          type: "button",
                          props: {
                            text: "🔄 Refresh Data",
                            variant: "secondary",
                            action: "refreshData",
                          },
                        },
                        {
                          type: "button",
                          props: {
                            text: "🗑️ Cleanup Old Data",
                            variant: "outline",
                            action: "cleanupOldMetrics",
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            // ==================== MAIN CONTENT GRID ====================
            {
              type: "container",
              props: {
                layout: "grid",
                columns: 2,
                gap: 24,
                className: "grid-cols-1 lg:grid-cols-2",
              },
              children: [
                // ==================== HOSTS CARD ====================
                {
                  type: "card",
                  props: {
                    variant: "elevated",
                    className: "overflow-hidden",
                  },
                  children: [
                    {
                      type: "cardHeader",
                      props: {
                        text: "🖥️ Docker Hosts",
                        className: "bg-surface-elevated border-b border-border-default px-4 py-3",
                      },
                    },
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
                              { key: "hostName", title: "Host", sortable: true },
                              { key: "os", title: "OS" },
                              { key: "dockerVersion", title: "Docker" },
                              { key: "containers", title: "Containers", align: "center" },
                              {
                                key: "containersRunning",
                                title: "Running",
                                align: "center",
                              },
                            ],
                            striped: true,
                            hoverable: true,
                            searchable: true,
                            searchPlaceholder: "Search hosts...",
                            size: "sm",
                          },
                          bindings: {
                            data: "dashboard.hosts",
                          },
                        },
                      ],
                    },
                  ],
                },
                // ==================== CONTAINERS CARD ====================
                {
                  type: "card",
                  props: {
                    variant: "elevated",
                    className: "overflow-hidden",
                  },
                  children: [
                    {
                      type: "cardHeader",
                      props: {
                        text: "📦 Container Metrics",
                        className: "bg-surface-elevated border-b border-border-default px-4 py-3",
                      },
                    },
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
                              { key: "name", title: "Container", sortable: true },
                              { key: "state", title: "State" },
                              { key: "cpuUsage", title: "CPU %", align: "right" },
                              { key: "memoryUsage", title: "Memory", align: "right" },
                            ],
                            striped: true,
                            hoverable: true,
                            searchable: true,
                            searchPlaceholder: "Search containers...",
                            size: "sm",
                          },
                          bindings: {
                            data: "dashboard.containers",
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            // ==================== DIVIDER WITH LABEL ====================
            {
              type: "divider",
              props: {
                variant: "default",
                label: "Detailed Metrics",
                className: "my-4",
              },
            },
            // ==================== FULL WIDTH DETAILED TABLE ====================
            {
              type: "card",
              props: {
                variant: "default",
                className: "overflow-hidden",
              },
              children: [
                {
                  type: "cardHeader",
                  props: {
                    text: "📈 All Container Metrics",
                    className: "bg-surface-default border-b border-border-default px-4 py-3",
                  },
                },
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
                          { key: "cpuUsage", title: "CPU %", align: "right", sortable: true },
                          { key: "memoryUsage", title: "Memory Used", align: "right" },
                          { key: "memoryLimit", title: "Memory Limit", align: "right" },
                          { key: "networkRx", title: "Net RX", align: "right" },
                          { key: "networkTx", title: "Net TX", align: "right" },
                        ],
                        striped: true,
                        hoverable: true,
                        searchable: true,
                        searchPlaceholder: "Search all containers...",
                        size: "md",
                      },
                      bindings: {
                        data: "dashboard.containers",
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
      // ==================== HOSTS PAGE ====================
      {
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
                          { key: "totalMemory", title: "Total Memory", align: "right" },
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
      },
      // ==================== CONTAINERS PAGE ====================
      {
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
                          { key: "memoryUsage", title: "Memory Used", align: "right" },
                          { key: "memoryLimit", title: "Memory Limit", align: "right" },
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
