General Information:


:::info
To use the nightly dev images please replace `"ghcr.io/its4nik/dockstat(api):latest"` with `"ghcr.io/its4nik/dockstat(api):dev"`

:::

# Production environment

## Proxy

To use the DockStatAPI we also have to install docker DockerSocketProxy on all our target hosts.\nThe following configuration can be used for said Proxy:

```yaml
# Docker Socket Proxy
services:
  docker-socket-proxy:
    container_name: docker-proxy-fin-1
    privileged: true
    environment:
      - CONTAINERS=1
      - INFO=1
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 2375:2375
    image: tecnativa/docker-socket-proxy
    restart: always
```


:::info
**The proxy only needs to be installed on one of your target servers!**

:::


---

## DockStatAPI

The DockStatAPI is the container that does the data gathering from all of the *docker-socket-proxy-nodes.* So this container can also be ran from any other server ==(in the future used for high-availability)==!

```yaml
# DockStatAPI
services:
  dockstatapi-demo:
    image: ghcr.io/its4nik/dockstatapi:latest
    container_name: dockstatapi-demo
    environment:
      - SECRET="SECRET"
      - ALLOW_LOCALHOST="False"
    ports:
      - "7071:7070"
    volumes:
      - ./dockstat/config:/api/config # Place your hosts.yaml file here
    restart: always
```

| Variables | Values |
|----|----|
| SECRET\* | Can be any string |
| ALLOW_LOCALHOST | True / False |


:::warning
\*) required

:::

| Volumes | Usage |
|----|----|
| \`\`\`yaml |    |
| ./dockstat/config:/api/config |    |
| \`\`\` | Inside the `config` folder you have to place your `hosts.yaml` file.More about this file [🖌️ Customization](/doc/customization-PiBz4OpQIZ#h-general-example) |

* Secret:

  The secret is a string used for authentication with the frontend, you also have to add this secret to the frontend (more below).
* ALLOW_LOCALHOST:

  This allows any traffic from `http://localhost` or something like `127.0.0.0/8`.


---

## DockStat

This is the actual frontend of the "DockStack" *(DockStat Stack),* feel free to write your own frontend but please message me so that we can credit your work on the github!

```yaml
# DockStat
services:
  dockstat-demo:
    image: ghcr.io/its4nik/dockstat:latest
    container_name: dockstat-demo
    ports:
      - "4445:3000"
    environment:
      - API_URL="XXX" # Host of the DockStatAPI endpoint
      - DEFAULT_THEME="night"
      - SECRET="secret"
      - LOGO_SIZE="m"
      - DM_LOGO_COLOR="original"
      - LM_LOGO_COLOR="original"
    volumes:
      - ./dockstat/icons:/app/build/icons
```

| Variables | Values |
|----|----|
| API_URL\* | Any String; URL of your DockstatAPI endpoint |
| DEFAULT_THEME | Chose between these [themes](https://outline.itsnik.de/doc/themes-BFhN6ZBbYx). |
| SECRET\* | The same secret string you defined in the DockStatAPI container. |
| LOGO_SIZE | The size of the Logo, choose between these sizes: `XS, S, M, L, XL` |
| DM_LOGO_COLOR\*\* | This is the Dark-Mode-Logo color of the SVG icons you can use. You can enter all hex codes you want (without transparency) |
| LM_LOGO_COLOR\*\* | This is the Light-Mode-Logo color of the SVG icons you can use. You can enter all hex codes you want (without transparency) |


:::warning
\*) required

:::


:::info
\*\*) To use the original logo color provided by simple icons please use `"original"` in said variable.

:::

| Volumes | Usage |
|----|----|
| \`\`\`yaml |    |
| ./dockstat/icons:/app/build/icons |    |

``` | This path is used if you want to add custom images as logos. |

# Build from Source

Please use this script provided as a one liner install

```bash
curl https://raw.githubusercontent.com/Its4Nik/dockstat/main/source-install.sh > install.sh && chmod +x ./install.sh && bash ./install.sh
```

## Backend

The backend configuration mostly happens inside the `hosts.yaml` file, more information here: [🖌️ Customization](/doc/customization-PiBz4OpQIZ)

The `hosts.yaml` file looks like this, have a look at the comments or the configuration ([🖌️ Customization](/doc/customization-PiBz4OpQIZ)) of this file.

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
    url: example
    port: 2375

container:
  dozzle: # Container name
    link: https://github.com
    icon: minecraft.png
    tags: private,raspberry
```

This file needs to be placed at `/config/hosts.yaml`.


:::info
Please see the [🖌️ Customization](/doc/customization-PiBz4OpQIZ) for setting *Tags*, *Logos* and *Quick*-Links

:::

You can add your desired hosts inside the host category, the first part, in this example `YourHost1`, is the name of the host which will be shown in the default DockStat Frontend.


1. `url: domain name / hostname / ip adress` this should be the Endpoint for the DockStatAPI.
2. `port: Any integer` this is the port where the socket proxy runs on.


---


:::warning
To enable key authentication for the DockStatAPI you have to set a password manually in the code:

```javascript
// dockstatapi.js
// From this (Line 10):
const key = process.env.SECRET || 'CHANGE-ME';

// To this:
const key = 'MY-SUPER-SECRET-PASSWORD';
```

Or disable authentication for local networks inside the code directly:

```javascript
// dockstatapi.js
// From this (line 12):
const skipAuth = process.env.SKIP_AUTH || 'False'

// To this:
const skipAuth = 'True'
```

:::


---

## Frontend

To set things up on the Source install we have to write our own config files and adjust code manually.

```json
{
    "API_URL": "API_URL",
    "DEFAULT_THEME": "DEFAULT_THEME",
    "SECRET": "SECRET",
    "LOGO_SIZE": "TAILWIND_LOGO_SIZE",
    "DARK_MODE_LOGO_COLOR": "DM_LOGO_COLOR",
    "LIGHT_MODE_LOGO_COLOR": "LM_LOGO_COLOR"
}
```


:::info
Please see [💿 Installation](/doc/installation-DaO99bB86q#h-dockstat) to know what each variable does.

:::

Keep in mind you have to sanitize this input.

| Rules | Example |
|----|----|
| `"API_URL": "API_URL"` | `"API_URL": "http://127.0.0.1:4444"` |
| `"DEFAULT_THEME": "DEFAULT_THEME",` | `"DEFAULT_THEME": "dracula"` |
| `"SECRET": "SECRET"` | `"SECRET": "XXXXXXXXXXXXXXXX"` (any string) |
| `"LOGO_SIZE": "TAILWIND_LOGO_SIZE"` | `"LOGO_SIZE": "w-12"` / `"LOGO_SIZE": "w-12"` (Defaults: w-12, w-16, w-20, w-24, w-32) |
| \`\`\`json |    |
| "DARK_MODE_LOGO_COLOR": "DM_LOGO_COLOR", |    |
| "LIGHT_MODE_LOGO_COLOR": "LM_LOGO_COLOR" |    |

``` | Hex value but **WITHOUT** the "*#*" |

This has to be placed here: `/public/config.json`.
```