# Frontend

## Variables

DockStat provides some optional variables out of the box that you can adjust to change the standard view.

When adding the container to your docker compose file you have these variables:

| Variable Name | Type | Default value |
|----|----|----|
| `DEFAULT_THEME` | String | Empty |
| `LOGO_SIZE` | String | M |
| `DM_LOGO_COLOR`\* | String | #FFFFFF (white) |
| `LM_LOGO_COLOR`\* | String | #000000 (black) |


:::info
\*) Please see [🖌️ Customization](/doc/customization-PiBz4OpQIZ#h-logo-customization) for more information

:::

## Description

* `DEFAULT_THEME`: You can choose a default theme to be used when opening your DockStat instance, please choose between one of these themes: [🎨 Themes](/doc/themes-BFhN6ZBbYx)
* `LOGO_SIZE`: The Logo size is a variable which controls a Tailwind-CSS class name, you can choose between: `XS, S, M, L, XL`

## Logo Customization

### SVG icons

DockStat provides a way to use the Simple Icon CDN to load svg images. To use those icons you have to change it here.

### Custom Images

To use custom images as Logo for a container you have to mount this path outside of the container: `/app/build/icons`

Afterwards you can place add any compatible image format in that directory.


---

# Backend

The Backend is the main point where configuration happens, here we can specify quick-links, logos, tags and more.


:::success
All configuration happens inside the `hosts.yaml` file.

:::

## General Example

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
    url: hetzner
    port: 2375

  YourHost2:
    url: 100.78.180.21
    port: 2375

container:
  dozzle: # Container name
    link: https://github.com
    icon: minecraft.png
    tags: private,raspberry
```

As we can see we have 4 sections.

The "log" section is used to configure the logging behavior.

The "hosts" section is where we declare our target hosts from where we gather the information.

"container" section is used to configure each container individually to adjust the wanted tags, links and icons.

## SVG icons (from Simple-icons)

To add a simple icon svg image you have to prefix the wanted simple icon with "SI:" afterwards desired icon, so for redis we would enter "SI:redis".

```yaml
container:
  redis:
    icon: "SI:redis"
```

## PNG / JPG icons

To add your own custom images you have to mount a path like described here: [🖌️ Customization](/doc/customization-PiBz4OpQIZ#h-custom-images). Afterwards you can place any picture in that directory, then you just have to reference it in the container tab.


:::info
Please note you can also create folders here but then you would have to adjust the path in the icon reference.

:::

```yaml
# Logo which is directly in the mounted path
container:
  redis:
    icon: "my-redis-icon.png"
```

```yaml
# Logo which is inside a directory
container:
  redis:
    icon: "databases/my-redis-icon.png"
```

## Quick Links

Quick Links provide a way to add links to your container, so if you have a container called "DockStat" you can add q Quick-Link which will be available to click on in the frontend.

### Example

 ![Container Information](/api/attachments.redirect?id=4fb32572-cfd2-4039-871f-ebc4f3a1caa4 "right-50 =299x296")

 ![Container Card](/api/attachments.redirect?id=2cb2fd28-2185-4e53-a4f6-aaa6cc04bba1 "left-50 =337x185")


\
### Code

```yaml
container:
  dockstatapi-demo:
    link: https://dockstatapidemo.hetzner.itsnik.de/stats
```


---

## Tags

### Description

Tags are used to group containers visually together and to make it easier to see what container serves what purpose. For example a "public" tag could be added to all containers that are publicly available, or "VPN" for containers that are only accessible via a VPN. The only limit is the sky (And maybe how much space your tags need)!

### Example

 !["Public" tag](/api/attachments.redirect?id=448f628f-91cf-46f2-b16b-6c097ea87b28 " =486x267")

### Code

We define the tags inside the "tags" section of the `hosts.yaml` file.

```yaml
tags:
  public: yellow-400
  private: red-800
  vpn: green-700
  
 # ...
 
 container:
   dockstatapi-demo:
     tags: public
     
   dockstat-private:
     tags: vpn,private
```

As you can see we define the tags like classes and add them to our desired containers.

We can add as many tags to a container as we want, but keep in mind the text might overlap on smaller grid sizes or devices.

The available colors for the tags can be found [here](https://github.com/Its4Nik/dockstat/blob/main/src/components/css/Tags.css) (raw CSS) or [here](https://tailwindcss.com/docs/border-color) (tailwind documentation), please keep in mind when looking at the tailwind documentation that only full 360° borders are supported.


---

## Notification (Needs further testing)

The notification service is officially supported since this [commit](https://github.com/Its4Nik/dockstatapi/commit/8d1d29e87764eaac4f727aa4bd18194524457fad).

The notification service uses apprise under the hood, to configure it we use the apprise configuration file.

So please create a [apprise_config.yml](https://github.com/Its4Nik/dockstatapi/blob/main/config/apprise_config_example.yml "apprise_config_example.yml") next to the hosts.yaml file in your backend.

### Example

```yaml
# apprise_config.yml
# Please see the apprise documentation
urls:
  - tgram://bottoken/ChatID
  - rocket://user:password@hostname/RoomID/Channel
  - ntfy://topic/
```

### Usage

You can add as many "targets" as you want in this file and apprise will notify each of them.

Please see the Apprise GitHub to see which services are currently supported.

[https://github.com/caronc/apprise](https://github.com/caronc/apprise?tab=readme-ov-file#supported-notifications).

### Available Messages

| Event | Message |
|----|----|
| ADD | `🆕 Container Added: $CONTAINER_NAME ($CONTAINER_ID) on $HOST` |
| REMOVE | `🚫 Container Removed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST` |
| EXIT | `❌ Container Exited: $CONTAINER_NAME ($CONTAINER_ID) on $HOST` |
| ANY | `⚠️ Container State Changed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST - New State: $STATE` |

### Custom messages (untested)

To use custom messages you have to change environment variables inside your docker compose file.

```yaml
services:
  dockstatapi-demo:
    image: ghcr.io/its4nik/dockstatapi:latest
    container_name: dockstatapi-demo
    environment:
      - SECRET="SECRET"
      - ALLOW_LOCALHOST="False"
      - ADD_MESSAGE='🆕 Container Added: $CONTAINER_NAME ($CONTAINER_ID) on $HOST'
      - REMOVE_MESSAGE='🚫 Container Removed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST'
      - EXIT_MESSAGE='❌ Container Exited: $CONTAINER_NAME ($CONTAINER_ID) on $HOST'
      - ANY_MESSAGE='⚠️ Container State Changed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST - New State: $STATE'
    ports:
      - "7071:7070"
    volumes:
      - ./dockstat/config:/api/config # Place your hosts.yaml file here
    restart: always
```