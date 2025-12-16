---
id: c85f4dd0-6855-418c-854d-062d86adb158
title: API reference
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 9550ca5f-3b09-4e4d-9ea9-634b4cc1553d
updatedAt: 2025-12-16T17:26:01.804Z
urlId: 1PTxqx1MQ6
---

Since the new backend is currently under active development this page might be outdated. Please see the following issue for a more up-to-date status:

<https://github.com/Its4Nik/dockstatapi/issues/16> (hover this link for quick overview).

# Available root-routes:

| Root-Routes | Functionality |
|----|----|
| /auth | Controlling of authentication service |
| /data | Database queries, used for historic data and database management |
| /frontend | Exposed routes for configuring various settings for a/the frontend |
| /api | Only get endpoints, used for fetching configuration data and forcing a new request to the docker sockets instead of querying the database. |
| /conf | Endpoints for configuring backend options |
| /notification-service | configuration of the notification service integrated into the DockStatApi. |
| /ha | Only used for the High Availability synchro |


---

# Symbol legend

| **✅** | Required |
|----|----|
| **❌** | Optional |
| ⛔ | Not needed |

## Auth routes:

### POST: /auth/enable


:::info
sets a current password and enables auth for all endpoints, except the api-docs

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Query | password | :white_check_mark: |


---

### POST: /auth/disable


:::info
Disables authentication for all endpoints

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Query | password | :white_check_mark: |


---

## Database queries

### GET: /data/latest


:::info
Queries the latest entry of the database and provides it as a JSON response.

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | :no_entry: |


---

### GET: /data/time/24h


:::info
Queries all the latest data of the database in a 24h timeframe and organizes them in a JSON array.

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | **⛔** |


---

### DELETE: /data/clear


:::info
Clears \*\*\*ALL \*\*\*entries of the SQLite database.

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | **⛔** |


---

## Frontend routes:


:::info
**\***) When referring to a config the frontend config at the path: `/data/frontendConfiguration.json` is meant.

:::

### POST: /frontend/show/{==containerName==}


:::info
Sets a container to visible in the config\*\*\*\*\*

:::

| Parameter Type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |


---

### POST: /frontend/tag/{==containerName==/{==tag==}


:::info
Adds a tag to a container inside the config\*, as an array for multiple tags

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |
| Path | ==tag== | :white_check_mark: |


---

### POST: /frontend/pin/{==containerName==}


:::info
#### Sets "pinned" to true, inside the config\*

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |


---

### POST: /frontend/add-link/{==containerName==}/{==link==}


:::info
Sets the "link" string inside the config\*

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |
| Path (might change) | ==link== | :white_check_mark: |


---

### POST: /frontend/add-icon/{==containerName==}/{==icon==}/{==useCustomIcon==}


:::info
Configures the icon string inside the config, when useCustomIcon is true the path file path of the icon gets to adjust with custom/{==icon==}.png

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |
| Path (string WITHOUT file type) | ==icon== | :white_check_mark: |
| Path (boolean) | ==useCustomicon== | :x: |

### DELETE: /frontend/hide/{==containerName==}


:::info
Sets "hidden" to true inside the config\*

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |


---

### DELETE: /frontend/remove-tag/{==containerName==}/{==tag==}


:::info
Removes the specified tag from the frontend config\* tag-array

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |
| Path | ==tag== | :white_check_mark: |


---

### DELETE: /frontend/unpin/{==containerName==}


:::info
Sets "pinned" to false inside the config\*

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |


---

### DELETE: /frontend/remove-link/{==containerName==}


:::info
Removes the "link" string from the config\*

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==cotnainerName== | :white_check_mark: |


---

### DELETE: /frontend/remove-icon/{==containerName==}


:::info
Removes the "icon" string from the config\*

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==containerName== | :white_check_mark: |

## API

### GET: /api/hosts


:::info
Retrieves a JSON list of all available hosts

:::

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | **⛔** |


---

### GET: /api/host/{==hostName==}/stats


:::info
Queries a specified host and provides data as a JSON structure

:::

Example response:

```javascript
{
  "hostName": "XXX",
  "info": {
    "ID": "XXX",
    "Containers": 19,
    "ContainersRunning": 19,
    "ContainersPaused": 0,
    "ContainersStopped": 0,
    "Images": 17,
    "OperatingSystem": "Ubuntu 22.04.5 LTS",
    "KernelVersion": "5.15.0-121-generic",
    "Architecture": "x86_64",
    "MemTotal": 8123764736,
    "NCPU": 4
  },
  "version": {
    "Components": {
      "Engine": "27.3.1",
      "containerd": "1.7.22",
      "runc": "1.1.14",
      "docker-init": "0.19.0"
    }
  }
}
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==hostName== | :white_check_mark: |


---

### GET: /api/containers


:::info
Queries all docker hosts directly and provides a JSON output

:::

Example response:

```javascript
{
  "XXX": [
    {
      "name": "portainer",
      "id": "XXX",
      "hostName": "XXX",
      "state": "running",
      "cpu_usage": 1670000,
      "mem_usage": 10727424,
      "mem_limit": 8123764736,
      "net_rx": 584519242,
      "net_tx": 27036706,
      "current_net_rx": 584519242,
      "current_net_tx": 27036706,
      "networkMode": "docker-important_default"
    }
   ],
   "YYY": [
    {
      "name": "dozzle",
      "id": "XXX",
      "hostName": "YYY",
      "state": "running",
      "cpu_usage": 1670000,
      "mem_usage": 10727424,
      "mem_limit": 8123764736,
      "net_rx": 584519242,
      "net_tx": 27036706,
      "current_net_rx": 584519242,
      "current_net_tx": 27036706,
      "networkMode": "default"
    }
   ]
  }
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | ⛔ |


---

### GET: /api/config


:::info
Provides the current backend config as JSON

:::

Example response:

```javascript
{
  "hosts": [
    {
      "name": "XXX",
      "url": "YYY",
      "port": "ZZZ"
    }
  ]
}
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | ⛔ |


---

### GET: /api/current-shedule


:::info
Retrieves and provides the current schedule settings in seconds

:::

Example response:

```javascript
{
  "interval": 300
}
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | ⛔ |


---

### GET: /api/frontend-config


:::info
Provides the frontend config used for various settings

:::

Example response:

```javascript
[
  {
    "name": "XXX",
    "hidden": true,
    "tags": [
      "YYY"
    ],
    "pinned": true
  }
]
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | ⛔ |


---

### GET: /api/status


:::info
Returns a 200 status with an "up" message to indicate the server is up and running. Used for Health checks

:::

Example response:

```json
{
  "status": "up"
}
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | ⛔ |


---

### PUT: /conf/addHost


:::info
Adds another host as target

:::

| Response Code | Description |
|----|----|
| 200 | Host added successfully. |
| 400 | Bad request, invalid input. |
| 500 | An error occurred while adding the host. |

| Parameter type | Parameter name | Required? |
|----|----|----|
| Query | name | :white_check_mark: |
| Query | URL | :white_check_mark: |
| Query | port | :white_check_mark: |


---

## Conf

### PUT: /conf/scheduler


:::info
Set a new scheduler interval (has to be 5 minutes or more)

:::

| Response code | Description |
|----|----|
| 200 | Fetch interval set successfully. |
| 400 | Invalid interval format or out of range. |

| Parameter type | Parameter name | Required? |
|----|----|----|
| Query | interval | :white_check_mark: |


---

### DELETE: /conf/removeHost


:::info
Removes a specified host from the config

:::

| Response code | Description |
|----|----|
| 200 | Host removed successfully. |
| 404 | Host not found. |
| 500 | An error occurred while removing the host. |

| Parameter type | Parameter name | Required? |
|----|----|----|
| Query | hostName | :white_check_mark: |


---

## Notification Services

### GET: /notification-service/get-template


:::info
Retrieve the notification template

:::

Example response:

```json
{
  "message": "{{name}} is {{state}}"
}
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| None | None | ⛔ |


---

### POST: /notification-service/set-template


:::info
Update the notification text with templating functionality

:::

Example Request body:

```javascript
{
  "message": "string"
}
```

| Parameter type | Parameter name | Required? |
|----|----|----|
| Request body | None | :white_check_mark: |


---

### POST: /notification-service/test/{==type==}/{==containerId==}


:::info
Send a test notification using an existing container as a data source for the template

:::

> might change in the future to use a standart test message

| Parameter type | Parameter name | Required? |
|----|----|----|
| Path | ==type==\* | **✅** |
| Path | ==containerId== | :white_check_mark: |

*Type\*: this is the notification service you are trying to test, for example: telegram, mail, pushbullet, …*


---

## High Availability

WIP