import { DB } from '@dockstat/sqlite-wrapper'
import type { DOCKER } from '@dockstat/typings'
import type { Server, ServerWebSocket } from 'bun'
import DockerClient from '../src/docker-client'

/**
 * Example WebSocket integration using Bun's built-in WebSocket server
 * This demonstrates how to integrate the Docker client with a WebSocket server
 * for real-time web UI updates.
 */

interface WebSocketConnection {
  id: string
  ws: ServerWebSocket<{ connectionId: string }>
  subscriptions: Set<string>
  lastPing: number
}

class DockerWebSocketServer {
  private dockerClient: DockerClient
  private connections: Map<string, WebSocketConnection> = new Map()
  private pingInterval?: Timer
  private server?: Server

  constructor(private port = 8080) {
    // Initialize Docker client with monitoring enabled
    this.dockerClient = new DockerClient(
      new DB(':memory:', {
        pragmas: [
          ['journal_mode', 'WAL'],
          ['foreign_keys', 'ON'],
          ['synchronous', 'NORMAL'],
        ],
      }),
      {
        enableMonitoring: true,
        enableEventEmitter: true,
        monitoringOptions: {
          healthCheckInterval: 30000,
          containerEventPollingInterval: 3000,
          hostMetricsInterval: 15000,
          enableContainerEvents: true,
          enableHostMetrics: true,
          enableHealthChecks: true,
        },
      }
    )

    // Add Docker hosts (configure these for your environment)
    this.dockerClient.addHost({
      id: 1,
      host: 'localhost',
      port: 2375,
      secure: false,
      name: 'Local Docker',
    })

    this.setupDockerEventListeners()
    this.startHeartbeat()
  }

  public async start(): Promise<void> {
    this.server = Bun.serve({
      port: this.port,
      fetch: this.handleHTTP.bind(this),
      websocket: {
        message: this.handleWebSocketMessage.bind(this),
        open: this.handleWebSocketOpen.bind(this),
        close: this.handleWebSocketClose.bind(this),
        drain: this.handleWebSocketDrain.bind(this),
      },
    })

    console.log(`🚀 Docker WebSocket server started on port ${this.port}`)
    console.log(`   WebSocket endpoint: ws://localhost:${this.port}/ws`)
    console.log(`   HTTP endpoint: http://localhost:${this.port}`)
  }

  private async handleHTTP(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const connectionId = this.generateConnectionId()

      const success = this.server?.upgrade(request, {
        data: { connectionId },
      })

      if (success) {
        return undefined as any
      }

      return new Response('WebSocket upgrade failed', { status: 400 })
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      const stats = await this.getServerStats()
      return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ...stats,
      })
    }

    // Serve a simple HTML client for testing
    if (url.pathname === '/') {
      return new Response(this.getTestClientHTML(), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    return new Response('Not Found', { status: 404 })
  }

  private handleWebSocketOpen(
    ws: ServerWebSocket<{ connectionId: string }>
  ): void {
    const { connectionId } = ws.data
    const connection: WebSocketConnection = {
      id: connectionId,
      ws,
      subscriptions: new Set(),
      lastPing: Date.now(),
    }

    this.connections.set(connectionId, connection)
    console.log(`📡 New WebSocket connection: ${connectionId}`)

    // Create Docker client stream connection
    const streamManager = this.dockerClient.getStreamManager()
    if (streamManager) {
      streamManager.createConnection(connectionId)

      // Forward stream messages to WebSocket client
      streamManager.on(
        'message:send',
        (connId: string, message: DOCKER.StreamMessage) => {
          if (connId === connectionId && ws.readyState === 1) {
            ws.send(JSON.stringify(message))
          }
        }
      )
    }

    // Send welcome message with available channels
    this.sendWelcomeMessage(connectionId)
  }

  private handleWebSocketMessage(
    ws: ServerWebSocket<{ connectionId: string }>,
    message: string | Buffer
  ): void {
    const { connectionId } = ws.data
    const messageStr = message.toString()

    try {
      const parsedMessage = JSON.parse(messageStr)

      // Handle ping/pong
      if (parsedMessage.type === 'ping') {
        const connection = this.connections.get(connectionId)
        if (connection) {
          connection.lastPing = Date.now()
          ws.send(
            JSON.stringify({
              id: parsedMessage.id || 'pong',
              type: 'pong',
              timestamp: Date.now(),
            })
          )
        }
        return
      }

      // Handle subscription tracking
      const connection = this.connections.get(connectionId)
      if (connection) {
        if (parsedMessage.type === 'subscribe') {
          connection.subscriptions.add(parsedMessage.channel)
        } else if (parsedMessage.type === 'unsubscribe') {
          connection.subscriptions.delete(parsedMessage.channel)
        }
      }

      // Forward to stream manager
      const streamManager = this.dockerClient.getStreamManager()
      if (streamManager) {
        streamManager.handleMessage(connectionId, messageStr)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
      this.sendError(connectionId, 'Invalid JSON message')
    }
  }

  private handleWebSocketClose(
    ws: ServerWebSocket<{ connectionId: string }>
  ): void {
    const { connectionId } = ws.data
    this.handleDisconnection(connectionId)
  }

  private handleWebSocketDrain(
    ws: ServerWebSocket<{ connectionId: string }>
  ): void {
    // Handle backpressure if needed
    console.log(`WebSocket drain event for ${ws.data.connectionId}`)
  }

  private handleDisconnection(connectionId: string): void {
    console.log(`📡 WebSocket disconnected: ${connectionId}`)

    const streamManager = this.dockerClient.getStreamManager()
    if (streamManager) {
      streamManager.closeConnection(connectionId)
    }

    this.connections.delete(connectionId)
  }

  private setupDockerEventListeners(): void {
    // Forward Docker events to all connected clients
    this.dockerClient.events.on(
      'container:started',
      (hostId, containerId, containerInfo) => {
        this.broadcastEvent('container:started', {
          hostId,
          containerId,
          containerInfo,
        })
      }
    )

    this.dockerClient.events.on(
      'container:stopped',
      (hostId, containerId, containerInfo) => {
        this.broadcastEvent('container:stopped', {
          hostId,
          containerId,
          containerInfo,
        })
      }
    )

    this.dockerClient.events.on(
      'container:created',
      (hostId, containerId, containerInfo) => {
        this.broadcastEvent('container:created', {
          hostId,
          containerId,
          containerInfo,
        })
      }
    )

    this.dockerClient.events.on('container:removed', (hostId, containerId) => {
      this.broadcastEvent('container:removed', {
        hostId,
        containerId,
      })
    })

    this.dockerClient.events.on('host:health:changed', (hostId, healthy) => {
      this.broadcastEvent('host:health:changed', {
        hostId,
        healthy,
      })
    })

    this.dockerClient.events.on('error', (error, context) => {
      this.broadcastEvent('docker:error', {
        error: error.message,
        context,
      })
    })

    // Start Docker monitoring
    this.dockerClient.startMonitoring()
  }

  private sendWelcomeMessage(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.ws.readyState !== 1) return

    const streamManager = this.dockerClient.getStreamManager()
    const channels = streamManager?.getAvailableChannels() || []

    const welcomeMessage: DOCKER.StreamMessage = {
      id: 'welcome',
      type: 'data',
      data: {
        message: 'Connected to Docker WebSocket server',
        connectionId,
        availableChannels: channels,
        serverTime: new Date().toISOString(),
      },
      timestamp: Date.now(),
    }

    connection.ws.send(JSON.stringify(welcomeMessage))
  }

  private sendError(connectionId: string, errorMessage: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.ws.readyState !== 1) return

    const errorMsg: DOCKER.StreamMessage = {
      id: 'error',
      type: 'error',
      error: errorMessage,
      timestamp: Date.now(),
    }

    connection.ws.send(JSON.stringify(errorMsg))
  }

  private broadcastEvent(eventType: string, data: any): void {
    const eventMessage: DOCKER.StreamMessage = {
      id: `event-${Date.now()}`,
      type: 'data',
      channel: 'docker_events',
      data: {
        eventType,
        ...data,
      },
      timestamp: Date.now(),
    }

    this.broadcast(eventMessage)
  }

  private broadcast(message: DOCKER.StreamMessage): void {
    const messageStr = JSON.stringify(message)

    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === 1) {
        connection.ws.send(messageStr)
      }
    }
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now()
      const staleThreshold = 60000 // 1 minute

      for (const [connectionId, connection] of this.connections.entries()) {
        if (connection.ws.readyState === 1) {
          // Send ping
          connection.ws.send(
            JSON.stringify({
              id: 'server-ping',
              type: 'ping',
              timestamp: now,
            })
          )

          // Check for stale connections
          if (now - connection.lastPing > staleThreshold) {
            console.log(`🔌 Closing stale connection: ${connectionId}`)
            connection.ws.close()
          }
        } else {
          // Remove dead connections
          this.handleDisconnection(connectionId)
        }
      }
    }, 30000)
  }

  private generateConnectionId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  public getConnectionCount(): number {
    return this.connections.size
  }

  public getConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values())
  }

  public async getServerStats(): Promise<{
    connections: number
    dockerHosts: number
    totalContainers: number
    runningContainers: number
    uptime: number
  }> {
    const hostMetrics = await this.dockerClient.getAllHostMetrics()
    const totalContainers = hostMetrics.reduce(
      (sum, host) => sum + host.containers,
      0
    )
    const runningContainers = hostMetrics.reduce(
      (sum, host) => sum + host.containersRunning,
      0
    )

    return {
      connections: this.connections.size,
      dockerHosts: hostMetrics.length,
      totalContainers,
      runningContainers,
      uptime: process.uptime(),
    }
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down WebSocket server...')

    // Clear heartbeat
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    // Close all WebSocket connections
    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === 1) {
        connection.ws.close()
      }
    }

    // Stop server
    if (this.server) {
      this.server.stop()
    }

    // Cleanup Docker client
    await this.dockerClient.cleanup()

    console.log('✅ WebSocket server shutdown complete')
  }

  private getTestClientHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Docker WebSocket Test Client</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        .messages { height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
        .controls { margin: 10px 0; }
        button { padding: 10px 15px; margin: 5px; cursor: pointer; }
        input, select { padding: 8px; margin: 5px; }
        .message { margin: 5px 0; padding: 5px; border-left: 3px solid #007bff; }
        .error { border-left-color: #dc3545; }
        .event { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Docker WebSocket Test Client</h1>

        <div id="status" class="status disconnected">Disconnected</div>

        <div class="controls">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <button onclick="clearMessages()">Clear Messages</button>
        </div>

        <div class="controls">
            <h3>Subscribe to Channel:</h3>
            <select id="channelSelect">
                <option value="container_list">Container List</option>
                <option value="host_metrics">Host Metrics</option>
                <option value="container_stats">Container Stats</option>
                <option value="all_stats">All Stats (Combined)</option>
                <option value="docker_events">Docker Events</option>
            </select>
            <input type="number" id="hostId" placeholder="Host ID (if required)" value="1">
            <input type="text" id="containerId" placeholder="Container ID (if required)">
            <input type="number" id="interval" placeholder="Interval (ms)" value="2000">
            <button onclick="subscribe()">Subscribe</button>
            <button onclick="unsubscribe()">Unsubscribe</button>
        </div>

        <div id="messages" class="messages"></div>
    </div>

    <script>
        let socket = null;
        let subscriptions = new Map();

        function connect() {
            if (socket && socket.readyState === WebSocket.OPEN) {
                return;
            }

            socket = new WebSocket('ws://localhost:${this.port}/ws');

            socket.onopen = function() {
                updateStatus('Connected', 'connected');
                addMessage('Connected to Docker WebSocket server', 'event');
            };

            socket.onmessage = function(event) {
                try {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                } catch (error) {
                    addMessage('Error parsing message: ' + error.message, 'error');
                }
            };

            socket.onclose = function() {
                updateStatus('Disconnected', 'disconnected');
                addMessage('Disconnected from server', 'error');
            };

            socket.onerror = function(error) {
                addMessage('WebSocket error: ' + error, 'error');
            };
        }

        function disconnect() {
            if (socket) {
                socket.close();
                socket = null;
            }
        }

        function subscribe() {
            if (!socket || socket.readyState !== WebSocket.OPEN) {
                addMessage('Not connected to server', 'error');
                return;
            }

            const channel = document.getElementById('channelSelect').value;
            const hostId = document.getElementById('hostId').value;
            const containerId = document.getElementById('containerId').value;
            const interval = document.getElementById('interval').value;

            const subscribeMessage = {
                id: 'sub-' + Date.now(),
                type: 'subscribe',
                channel: channel,
                data: {
                    interval: parseInt(interval) || 2000,
                    ...(hostId && { hostId: parseInt(hostId) }),
                    ...(containerId && { containerId: containerId }),
                }
            };

            socket.send(JSON.stringify(subscribeMessage));
            addMessage(\`Subscribing to \${channel} channel\`, 'event');
        }

        function unsubscribe() {
            // For demo purposes, just show how to unsubscribe
            addMessage('Unsubscribe functionality would go here', 'event');
        }

        function handleMessage(message) {
            if (message.type === 'data' && message.channel) {
                if (message.channel === 'container_list') {
                    const containers = message.data;
                    addMessage(\`Container list update: \${containers.length} containers\`, 'event');
                } else if (message.channel === 'host_metrics') {
                    const metrics = message.data;
                    addMessage(\`Host metrics: \${metrics.containersRunning}/\${metrics.containers} containers running\`, 'event');
                } else if (message.channel === 'container_stats') {
                    const stats = message.data;
                    addMessage(\`Container stats: \${stats.name} - CPU: \${stats.cpuUsage.toFixed(2)}%\`, 'event');
                } else if (message.channel === 'all_stats') {
                    const allStats = message.data;
                    const containerCount = allStats.containerStats?.length || 0;
                    const hostCount = allStats.hostMetrics?.length || 0;
                    addMessage(\`All stats update: \${containerCount} containers, \${hostCount} hosts\`, 'event');
                } else if (message.channel === 'docker_events') {
                    addMessage(\`Docker event: \${message.data.eventType}\`, 'event');
                }
            } else if (message.type === 'pong') {
                // Handle pong silently
            } else if (message.type === 'error') {
                addMessage(\`Error: \${message.error}\`, 'error');
            } else {
                addMessage(JSON.stringify(message, null, 2));
            }
        }

        function updateStatus(text, className) {
            const status = document.getElementById('status');
            status.textContent = text;
            status.className = 'status ' + className;
        }

        function addMessage(text, type = 'message') {
            const messages = document.getElementById('messages');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.textContent = new Date().toLocaleTimeString() + ': ' + text;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        function clearMessages() {
            document.getElementById('messages').innerHTML = '';
        }

        // Auto-connect on page load
        window.onload = function() {
            connect();
        };
    </script>
</body>
</html>`
  }
}

// Example server startup
if (import.meta.main) {
  const server = new DockerWebSocketServer(8080)

  // Start the server
  server.start().catch(console.error)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...')
    await server.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...')
    await server.shutdown()
    process.exit(0)
  })

  // Log server stats every minute
  setInterval(async () => {
    const stats = await server.getServerStats()
    console.log('📊 Server Stats:', {
      connections: stats.connections,
      dockerHosts: stats.dockerHosts,
      containers: `${stats.runningContainers}/${stats.totalContainers} running`,
      uptime: `${Math.floor(stats.uptime / 60)}m ${Math.floor(stats.uptime % 60)}s`,
    })
  }, 60000)
}

export default DockerWebSocketServer
