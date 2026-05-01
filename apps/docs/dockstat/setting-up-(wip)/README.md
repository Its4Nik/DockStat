---
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
id: be9f71c8-40d0-400a-b08b-2893fa2993bf
parentDocumentId: 7dddd764-6483-4f84-96a3-988304e772d3
title: Setting Up (WIP)
updatedAt: 2026-04-26T14:54:12.777Z
urlId: lK4slg2Pea
---

:::info
The project is not ready for active deployment, this is a guide that I will be working on in the future.

\n(This guide is a big WIP :sob:)

:::

# Prerequisites

* Docker (*I am on version 29.4.0 but anything above 26 should* :tm: *work*)

# Setup

I recommend starting of with a fresh folder in any directory you want, for this guide we will use `**/opt/dockstat **`(same as in the container). \nIn there create a `**docker-compose.yaml**`**.** 

*You can use the following code as an example:*

```yaml
services:
  # Main DockStat Application
  dockstat:
    container_name: dockstat
    image: ghcr.io/its4nik/dockstat:1.0.0
    volumes:
        - "/opt/dockstat/db:/opt/dockstat/db"
    environment:
        DOCKSTAT_LOGGER_LEVEL: "Info"
    
        # Backend variables
        DOCKSTAT_API_PORT: "3030"
        
        # Required for OIDC callback(s), set your URL which you use for dockstat.   
        # If behind a reverse Proxy use the outside domain (and path) 
        FRONTEND_URL: "http://127.0.0.1:5173"
        # Also for OIDC, the Domain of the Backend your using
        BASE_URL: "http://127.0.0.1:3030"
        
        # Auth
        DOCKSTAT_AUTH_CRYPTO_SECRET: "please-please-please-change-me"
        DOCKSTAT_AUTH_JWT_SECRET: "please-please-also-change-me"
    ports:
        - "5173:5173"
        - "3030:3030"
        
  # DockNode, required for DockStacks feature
  docknode:
      container_name: local_docknode
      image: ghcr.io/its4nik/dockstat:1.0.0
      volumes:
          - "./stacks:/opt/docknode/stacks"
      environment:
          DOCKER_SOCKET_PATH: "/var/run/docker.sock"
      ports:
          - "4040:4040"
    
    # [ADVANCED] Dockstore Verification
    # This is deployed and hosted by me, any Plugin, Stacks or similar goes through a review 
    dockstore_verification:
        container_name: DVA
        image: dockstore-verification:latest
        volumes: 
            - "/opt/dockstat/dva/data:/opt/dockstore-verification/data"
            - "/opt/dockstat/dva/public:/opt/dockstore-verification/public"
       environment:
           VERIFICATION_PORT: "3100"
       ports:
           - "3100:3100" 
```

After running `docker compose up -d`you can go to @[http://localhost:5173](mention://7a9a9f3f-d8d9-4d67-90db-88d6a2cf152a/url/58e73669-6b5d-4f17-b5f0-0b7d5121578e) and be greeted by the sign-in page. If there is no Local User created or no OAuth connected service setup you will be prompted to.

# First Time starting DockStat

> When it's your first Time starting up, you will be greeted by a Registration form, after registration the guest sign up is disabled. 
>
> The guest registration can be enabled again on the Settings page under ***General > Additional Settings***

 ![](/api/attachments.redirect?id=725e01bf-209c-4943-910a-1b274fc8ff81 " =1920x1080")