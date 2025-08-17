DockStat will provide some integrations like [cup](https://github.com/sergi0g/cup) and more.

# [cup](https://github.com/sergi0g/cup)

## Description:      ![Example image](/api/attachments.redirect?id=964f512c-940a-4ee8-8ece-32c438d0ce45 "right-50 =460x231")

Cup is the easiest way to check for container image updates.

## Cup's features:

* Extremely fast. Cup takes full advantage of your CPU and is highly optimized, resulting in lightning fast speed. On my test machine, it took \~12 seconds for \~95 images.
* Supports most registries, including Docker Hub, ghcr.io, Quay, lscr.io and even Gitea (or derivatives)
* Doesn't exhaust any rate limits. This is the original reason I created Cup. It was inspired by [What's up docker?](https://github.com/fmartinou/whats-up-docker) which would always use it up.
* Beautiful CLI and web interface for checking on your containers any time.
* The binary is tiny! At the time of writing it's just 5.1 MB. No more pulling 100+ MB docker images for a such a simple program.
* JSON output for both the CLI and web interface so you can connect Cup to integrations. It's easy to parse and makes webhooks and pretty dashboards simple to set up!

## How to integrate?

As with all configuration regarding data gathering we are going to rely on the DockStatAPI.

We have to run the cup container, but don't very since it is written in #Rust you are not going to take a performance impact!

To define the Cup Host I've added a new environment variable to the DockStatAPI container:

```yaml
  dockstatapi:
    image: ghcr.io/its4nik/dockstatapi:latest
    container_name: dockstatapi
    environment:
      - SECRET="CHANGEME" # This is required in the header 'Authorization': 'CHANGEME'
      - CUP_URL="https://your-cup-host.com"
    ports:
      - "7070:7070"
    volumes:
      - ./dockstat/api:/api/config # Place your hosts.yaml file here
    restart: always
```

That's it! Now you see all available updates at a glance