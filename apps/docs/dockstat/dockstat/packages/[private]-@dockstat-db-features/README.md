---
id: c87977e4-e0f6-49ae-9cf5-e979c86605b1
title: "[PRIVATE] @dockstat/db Features"
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 75d80211-7262-4064-aaa6-2ead20e17f43
updatedAt: 2025-12-16T17:25:59.926Z
urlId: NWsT8KT5bX
---

## 🏗️ Core Architecture

### Type-Safe Foundation

* **Full TypeScript Support**: Complete type safety with @dockstat/typings integration
* **Dockerode Integration**: Built on the robust Dockerode library with enhanced abstractions
* **Modular Design**: Extensible architecture with separate concerns for monitoring, streaming, and client operations
* **Error Handling**: Comprehensive error handling with retry mechanisms and detailed error reporting

### Configuration & Options

* **Flexible Configuration**: Extensive configuration options for timeouts, retries, and monitoring
* **Environment Adaptability**: Support for both secure (HTTPS/TLS) and insecure HTTP connections
* **Resource Management**: Automatic cleanup and resource management with graceful shutdown

## 🐳 Docker Host Management

### Host Operations

* **Multi-Host Support**: Manage multiple Docker hosts simultaneously
* **Dynamic Host Management**: Add, remove, and update hosts at runtime
* **Connection Pooling**: Efficient connection management with automatic retry mechanisms
* **Health Monitoring**: Continuous health checks for all registered hosts

### Host Configuration

```typescript

interface HostConfig {
  id: number;           // Unique identifier
  host: string;         // IP address or hostname
  port: number;         // Specify the port of the socket proxy
  secure: boolean;      // SSL/TLS support
  name: string;         // Human-readable name
}
```

## 📦 Container Operations

### Container Lifecycle Management

* **Start/Stop/Restart**: Full container lifecycle control
* **Pause/Unpause**: Container execution control
* **Create/Remove**: Container creation and deletion with force options
* **Kill with Signals**: Send specific signals to containers (SIGTERM, SIGKILL, etc.)
* **Rename**: Dynamic container renaming

### Container Information

* **List Containers**: Get all containers across hosts with filtering options
* **Detailed Info**: Comprehensive container inspection data
* **Port Mapping**: Automatic port mapping discovery and formatting
* **Label Management**: Container label inspection and management
* **Network Information**: Container network settings and connectivity

### Container Execution

* **Execute Commands**: Run commands inside containers with full stdio control
* **Working Directory**: Set custom working directories for command execution
* **Environment Variables**: Pass environment variables to executed commands
* **Exit Code Handling**: Capture and handle command exit codes

### Container Logs

* **Stream Logs**: Real-time log streaming from containers
* **Historical Logs**: Retrieve historical log data with filtering
* **Timestamp Support**: Include timestamps in log output
* **Line Limiting**: Control log output volume with tail options
* **Time Range Filtering**: Filter logs by time ranges (since/until)

## 📊 Container Statistics & Monitoring

### Real-Time Statistics

* **CPU Usage**: Accurate CPU usage percentage calculation
* **Memory Usage**: Memory consumption and limits tracking
* **Network I/O**: Receive/transmit bytes tracking across all networks
* **Block I/O**: Disk read/write operations monitoring
* **Live Updates**: Real-time statistics with configurable intervals

### Calculated Metrics

* **Usage Percentages**: Automatic percentage calculations for resources
* **Resource Utilization**: Comprehensive resource utilization analysis
* **Performance Trends**: Historical performance data collection
* **Threshold Monitoring**: Configurable threshold-based alerts

### Statistics Aggregation

* **Host-Level Stats**: Aggregate statistics across all containers on a host
* **Cross-Host Stats**: Global statistics across all monitored hosts
* **Filtering**: Filter statistics by container state, image, or labels

## 🖥️ Host Metrics & System Information

### System Information

* **Docker Version**: Docker daemon version and API version
* **Operating System**: Host OS information and architecture
* **Hardware Info**: CPU count, memory, and storage information
* **Kernel Version**: Host kernel version information
* **Runtime Info**: Docker runtime and driver information

### Resource Metrics

* **Total Resources**: Host-level CPU, memory, and storage totals
* **Usage Statistics**: Current resource utilization across the host
* **Container Counts**: Running, stopped, and paused container counts
* **Image Statistics**: Total images and storage usage

### System Health

* **Daemon Status**: Docker daemon health and connectivity
* **Resource Availability**: Available system resources
* **Storage Usage**: Docker storage driver and usage information
* **Network Status**: Docker network configuration and status

## 📡 Real-Time Monitoring & Events

### Automated Monitoring

* **Health Checks**: Continuous host health monitoring with configurable intervals
* **Container Events**: Real-time container lifecycle event detection
* **Resource Monitoring**: Automatic resource usage monitoring
* **State Changes**: Detection of container and host state changes

### Event System

* **Typed Events**: Comprehensive event system with full TypeScript support
* **Event Categories**: Host events, container events, stream events, and error events
* **Event Context**: Rich context information for all events
* **Event Filtering**: Configurable event filtering and routing

### Monitoring Configuration

```typescript

interface MonitoringOptions {
  healthCheckInterval?: number;             // Default: 30000ms
  containerEventPollingInterval?: number;   // Default: 5000ms
  hostMetricsInterval?: number;             // Default: 10000ms
  enableContainerEvents?: boolean;          // Default: true
  enableHostMetrics?: boolean;              // Default: true
  enableHealthChecks?: boolean;             // Default: true
}
```

## 🌊 Streaming & Real-Time Updates

### WebSocket-Compatible Streaming

* **Bidirectional Communication**: Full duplex communication for web UIs
* **Channel-Based Subscriptions**: Subscribe to specific data channels
* **Connection Management**: Automatic connection lifecycle management
* **Message Queuing**: Efficient message queuing and delivery

### Stream Channels

* **Container Stats**: Real-time container statistics streaming
* **Host Metrics**: Host-level metrics streaming
* **Container Lists**: Live container list updates
* **All Stats**: Combined container statistics and host metrics streaming
* **Docker Events**: Real-time Docker daemon events
* **Container Logs**: Live log streaming (planned)

### Stream Features

* **Configurable Intervals**: Customize update frequencies per channel
* **Filtering**: Filter streamed data by criteria (state, image, labels)
* **Multiplexing**: Multiple concurrent streams per connection
* **Backpressure Handling**: Intelligent backpressure management
* **Atomic Updates**: Combined stats ensure consistent timestamp across all data

### Bun WebSocket Integration

* **Native Bun Support**: Built-in Bun WebSocket server integration
* **High Performance**: Optimized for high-throughput scenarios
* **Test Interface**: Built-in HTML test client for development
* **Auto-Reconnection**: Client-side reconnection logic

## 🖼️ Image Management

### Image Operations

* **List Images**: Retrieve all images with size and tag information
* **Pull Images**: Download images from registries with progress tracking
* **Image Inspection**: Detailed image metadata and layer information
* **Image Cleanup**: Planned: Image pruning and cleanup operations

### Registry Support

* **Multi-Registry**: Support for multiple Docker registries
* **Authentication**: Registry authentication support (planned)
* **Tag Management**: Image tag parsing and validation

## 🌐 Network Management

### Network Operations

* **List Networks**: Retrieve all Docker networks with driver information
* **Network Inspection**: Detailed network configuration and connected containers
* **Network Filtering**: Filter networks by driver type or custom criteria

### Network Information

* **Driver Support**: Support for all Docker network drivers
* **Container Connectivity**: Network connectivity mapping between containers
* **IP Address Management**: Container IP address tracking within networks

## 💾 Volume Management

### Volume Operations

* **List Volumes**: Retrieve all Docker volumes with mount information
* **Volume Inspection**: Detailed volume metadata and usage information
* **Mount Point Tracking**: Track volume mount points and usage

### Storage Management

* **Storage Drivers**: Support for all Docker storage drivers
* **Usage Analytics**: Volume usage tracking and analytics
* **Cleanup Operations**: Volume pruning and cleanup (planned)

## 🔧 System Operations

### System Information

* **Disk Usage**: Docker system disk usage analysis with df command
* **Version Information**: Complete Docker version and component information
* **System Events**: System-level Docker events monitoring

### Maintenance Operations

* **System Pruning**: Clean up unused containers, networks, and images
* **Resource Cleanup**: Comprehensive system resource cleanup
* **Health Diagnostics**: System health diagnostics and reporting

## 🛡️ Error Handling & Resilience

### Retry Mechanisms

* **Configurable Retries**: Customizable retry attempts and delays
* **Exponential Backoff**: Intelligent retry spacing
* **Circuit Breaker**: Prevent cascading failures
* **Graceful Degradation**: Continue operation when some hosts are unavailable

### Error Classification

* **Network Errors**: Connection and timeout error handling
* **API Errors**: Docker API error classification and handling
* **Validation Errors**: Input validation and sanitization
* **Resource Errors**: Resource exhaustion and limit handling

### Logging & Debugging

* **Structured Logging**: Comprehensive logging with context
* **Debug Information**: Detailed debug information for troubleshooting
* **Error Context**: Rich error context for better diagnostics
* **Performance Metrics**: Operation timing and performance tracking

## 🔌 Utility Functions

### Data Formatting

* **Byte Formatting**: Human-readable byte size formatting (1.5 GB, 256 MB)
* **Time Formatting**: Uptime and duration formatting (1h 30m 45s)
* **Percentage Formatting**: CPU and memory percentage formatting
* **Rate Formatting**: Network and disk I/O rate formatting

### Validation & Sanitization

* **Container Names**: Docker container name validation and sanitization
* **Image Names**: Docker image name parsing and validation
* **Port Validation**: Port number and mapping validation
* **Label Validation**: Docker label key/value validation

### Health Checks

* **Container Health**: Container health assessment based on metrics
* **Host Health**: Host health evaluation with configurable thresholds
* **Resource Monitoring**: Resource usage threshold monitoring
* **Performance Analysis**: Performance bottleneck detection

### Data Analysis

* **Summary Generation**: Generate summaries for containers and hosts
* **Trend Analysis**: Basic trend analysis for metrics
* **Aggregation**: Data aggregation across hosts and containers
* **Filtering**: Advanced filtering capabilities

## 🚀 Performance Optimizations

### Efficient Operations

* **Connection Reuse**: HTTP connection pooling and reuse
* **Parallel Processing**: Concurrent operations across multiple hosts
* **Caching**: Intelligent caching of frequently accessed data
* **Batch Operations**: Batch multiple operations for efficiency

### Memory Management

* **Stream Processing**: Memory-efficient stream processing
* **Garbage Collection**: Proper cleanup and garbage collection
* **Resource Pooling**: Efficient resource pooling and management
* **Memory Limits**: Configurable memory usage limits

### Network Optimization

* **Request Compression**: HTTP request/response compression
* **Keep-Alive**: HTTP keep-alive for persistent connections
* **Timeouts**: Intelligent timeout management
* **Rate Limiting**: Prevent API rate limit exhaustion

## 🧪 Testing & Development

### Test Suite

* **Unit Tests**: Comprehensive unit test coverage
* **Integration Tests**: Full integration testing with Docker daemon
* **Mock Support**: Docker daemon mocking for testing
* **Error Scenarios**: Error condition testing and validation

### Development Tools

* **Example Applications**: Complete example applications and use cases
* **Documentation**: Comprehensive API documentation and guides
* **TypeScript Support**: Full TypeScript definitions and IntelliSense
* **Debug Utilities**: Development and debugging utilities

### Example Applications

* **Basic Usage**: Simple Docker client usage examples
* **WebSocket Server**: Complete WebSocket server implementation
* **Monitoring Dashboard**: Real-time monitoring dashboard example
* **CLI Tools**: Command-line interface examples

## 📋 API Surface

### Main Classes

* **DockerClient**: Primary client class with all operations
* **HostHandler**: Docker host management
* **MonitoringManager**: Automated monitoring and events
* **StreamManager**: Real-time streaming and WebSocket support
* **DockerEventEmitter**: Type-safe event system

### Key Functions

* **getAllStats()**: Combined container statistics and host metrics in a single call
* **startAllStatsStream()**: Stream combined stats with configurable intervals
* **WebSocket all_stats channel**: Real-time combined stats for web applications

### Utility Modules

* **docker-helpers**: Utility functions for formatting and validation
* **WebSocket Integration**: Bun WebSocket server integration
* **Type Definitions**: Complete TypeScript type definitions

### Configuration Interfaces

* **DockerClientOptions**: Main client configuration
* **MonitoringOptions**: Monitoring system configuration
* **StreamOptions**: Streaming system configuration
* **WebSocket Options**: WebSocket server configuration

  \