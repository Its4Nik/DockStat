---
id: 0adaab7d-0b53-4d3e-9667-0dd0a0f719fd
title: Backend API reference
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: 88a86081-76f3-4056-985f-b0800ec2445f
updatedAt: 2025-08-18T22:50:51.287Z
urlId: YzcBbDvY33
---

# Authentication

The Authentication uses a token inside the header of the request, more examples here:

## 1 React:

```jsx
useEffect(() => {
    if (!apihost || !apiKey) return;
    const fetchData = async () => {
        try {
            const response = await fetch(`${apihost}/config`, {
                method: 'GET',
                headers: {
                    'Authorization': `${apiKey}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.text();
            setResult(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    fetchData();
}, [apihost, apiKey]);
```

## 2 Bash (curl)

```bash
curl -X GET "${apihost}/config" -H "Authorization: ${apiKey}"
```

## 3 JavaScript:

```javascript
if (apihost && apiKey) {
    (function fetchData() {
        fetch(`${apihost}/config`, {
            method: 'GET',
            headers: {
                'Authorization': `${apiKey}`,
            },
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch data');
            return response.text();
        })
        .then(data => {
            setResult(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    })();
}
```

## 4 TypeScript:

```typescript
useEffect(() => {
    if (!apihost || !apiKey) return;

    const fetchData = async (): Promise<void> => {
        try {
            const response = await fetch(`${apihost}/config`, {
                method: 'GET',
                headers: {
                    'Authorization': `${apiKey}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.text();
            setResult(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();
}, [apihost, apiKey]);
```

## 5. **XMLHttpRequest (Standard JavaScript without Fetch API):**

```javascript
if (apihost && apiKey) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${apihost}/config`, true);
    xhr.setRequestHeader('Authorization', `${apiKey}`);
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                setResult(xhr.responseText);
            } else {
                console.error('Error fetching data');
            }
        }
    };
    xhr.send();
}
```

# Endpoints

| Endpoints | Authentication | Method | Documentation |
|----|----|----|----|
| /stats | yes | GET | [🌐 Backend API reference](/doc/backend-api-reference-YzcBbDvY33#h-stats) |
| /hosts | yes | GET | [🌐 Backend API reference](/doc/backend-api-reference-YzcBbDvY33#h-hosts) |
| /config | yes | GET | [🌐 Backend API reference](/doc/backend-api-reference-YzcBbDvY33#h-config) |
| /status | no | GET | [🌐 Backend API reference](/doc/backend-api-reference-YzcBbDvY33#h-status) |

# `/stats`

## Description:

The `/stats` Endpoint is used to provide all statistics regarding the docker containers of an host.

## Example:

```json
{
  "YourHost1": [
    {
      "name": "dockstat-demo",
      "id": "2ec35ef9d8789c09cb0bbe820d099f9794a525943e494991b3608f8aaee44466",
      "hostName": "YourHost1",
      "state": "running",
      "cpu_usage": 49494987000,
      "mem_usage": 31481856,
      "mem_limit": 8123764736,
      "net_rx": 224714,
      "net_tx": 648853,
      "current_net_rx": 224714,
      "current_net_tx": 648853,
      "networkMode": "docker-important_default",
      "link": "",
      "icon": "",
      "tags": ""
    },
    {
      "name": "dockstat",
      "id": "237ed865f1bfbe6675d29dff5d0aaed0873be87d7b513190144eb41ec6a69060",
      "hostName": "YourHost1",
      "state": "running",
      "cpu_usage": 50673614000,
      "mem_usage": 33038336,
      "mem_limit": 8123764736,
      "net_rx": 460148,
      "net_tx": 441701,
      "current_net_rx": 460148,
      "current_net_tx": 441701,
      "networkMode": "docker-important_default",
      "link": "",
      "icon": "",
      "tags": ""
    }
  ],
  "YourHost2": [
    {
      "name": "traefik",
      "id": "81cdf86c9db1576bc5e2a296db9a285b580d93a4407568e28ad6f071c70d389c",
      "hostName": "YourHost2",
      "state": "running",
      "cpu_usage": 2478699136000,
      "mem_usage": 270741504,
      "mem_limit": 8127897600,
      "net_rx": 2336032715,
      "net_tx": 3340317255,
      "current_net_rx": 2336032715,
      "current_net_tx": 3340317255,
      "networkMode": "container:cc8f93acd96aaf2045bfab2908f71084ac30cc1d62f850685bb805fd0df45e7f",
      "link": "",
      "icon": "",
      "tags": ""
    },
    {
      "name": "nginx",
      "id": "b77c049de4dc3a5aed6ab3be08cb75f6d9a1d26f7d6f41df1605a57498157b22",
      "hostName": "YourHost2",
      "state": "running",
      "cpu_usage": 984765321000,
      "mem_usage": 141975552,
      "mem_limit": 8127897600,
      "net_rx": 2336054780,
      "net_tx": 3340344618,
      "current_net_rx": 2336054780,
      "current_net_tx": 3340344618,
      "networkMode": "container:cc8f93acd96aaf2045bfab2908f71084ac30cc1d62f850685bb805fd0df45e7f",
      "link": "",
      "icon": "",
      "tags": ""
    }
  ]
}
```


---

# `/hosts`

## Description:

This endpoint provides general information for each host the DockStatAPI is targeted at.

## Example:

```json
{
  "YourHost1": {
    "containerCount": 17,
    "totalCPUs": 4,
    "totalMemory": 8123764736,
    "cpuUsage": 30746841089000,
    "memoryUsage": "19.24"
  },
  "YourHost2": {
    "containerCount": 15,
    "totalCPUs": 4,
    "totalMemory": 8127897600,
    "cpuUsage": 56829592024000,
    "memoryUsage": "62.14"
  }
}
```


---

# `/config`

## Description:

The `/config` endpoint just provides the local config of the DockStatAPI endpoint.

## Example:

```yaml
mintimeout: 10000 # The minimum time to wait before querying the same server again, defaults to 5000 Ms

log:
  logsize: 10 # Specify the Size of the log files in MB, default is 1MB
  LogCount: 1 # How many log files should be kept in rotation. Default is 5

tags:
  raspberry: red-200
  private: violet-400

hosts:
  YourHost1:
    url: 1.1.1.1
    port: 2375

  YourHost2:
    url: 2.2.2.2
    port: 2375

container:
  dozzle: # Container name
    link: https://github.com
    icon: minecraft.png
    tags: private,raspberry
```


---

# `/status`

## Description

This is a simple Endpoint used by the docker health-check to se if the container is up.

This endpoint will just provide "UP" and a status code of 200 if the server is running.