DockStatAPI comes with 7 default notification providers:


1. Discord (Webhooks)
2. E-Mail
3. Pushbullet
4. Pushover
5. Slack
6. Telegram
7. WhatsApp (Official WhatsApp API token needed)


---

# Configure Notification template

We use a templating functionality for the notification messages, this is the default template:

```json
{
  "text": "{{name}} ({{id}}) on {{hostName}} is {{state}}"
}
```

Usable variables:

| Identifier | Example data |
|----|----|
| `name` | "My-Awesome-Container" |
| `id` | "a6b6c34350b40f310fa24b0a3564b0e8897ca604acd483713cad8a27b7284cef" |
| `state` | "running" |
| `hostName` | "Host-1" |

The data for those notifications is kept here: `./src/data/states.json` and the template is kept here: `./src/data/template.json`.

# Configuring Notification providers


:::info
All notification providers are configured using environment variables

:::

## :three_button_mouse: Discord

In your docker-compose.yaml:

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - DISCORD_WEBHOOK_URL: "..."
```

Just add the URL of the discord Webhook to said variable.

## :email: E-Mail

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - EMAIL_SENDER: "..."
      - EMAIL_RECIPIENT: "..."
      - EMAIL_PASSWORD: "..."
      - EMAIL_SERVICE: "..."
```

Please see [nodemailer/well-known-services](https://community.nodemailer.com/2-0-0-beta/setup-smtp/well-known-services/).

## :bullettrain_front: Pushbullet

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - PUSHBULLET_ACCESS_TOKEN: "..."
```

> To access your Pushbullet token, **navigate to Pushbullet's My Account page.** **It will appear under the Access Token heading**. This is confidential information that your server sends via a secure channel.

## :bullettrain_side: Pushover

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - PUSHOVER_USER_KEY: "..."
      - PUSHOVER_API_TOKEN: "..."
```

:link: <https://pushover.net/api>

## :wavy_dash: Slack

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - SLACK_WEBHOOK_URL: "..."
```

:link: <https://api.slack.com/messaging/webhooks>

## :airplane: Telegram

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - TELEGRAM_BOT_TOKEN: "..."
      - TELEGRAM_CHAT_ID: "..."
```

:link: <https://core.telegram.org/bots/api#authorizing-your-bot>

:link: <https://core.telegram.org/bots/features#botfather>

## :telephone_receiver: WhatsApp


:::warning
Needs a WhatsApp business plan

:::

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    environment:
      - WHATSAPP_API_URL: "..."
      - WHATSAPP_RECIPIENT: "..."
```

:link: <https://developers.facebook.com/docs/whatsapp/cloud-api/get-started>

# Custom notifications

To add custom notifications you can specify them in a JavaScript file, you can just place them here: `notifications/custom/myCustomNotification.js`

And specify all custom Notification types with a List inside `CUSTOM_NOTIFICATIONS`

## Use them with docker

```yaml
services:
  dockStatAPI:
    image: ghcr.io/its4nik/dockstatapi
    container_name: "DockStatAPI"
    ports:
      - 9876:9876
    volumes:
      - "./dockstatapi/notifications:/api/utils/notifications/custom"
    environment:
      - CUSTOM_NOTIFICATIONS="myCustomNotification.js,mySecondCustomNotification.js,..."
```

## How to write custom notification modules

```javascript
import { renderTemplate } from "./../_template";

export async function myNotification(containerId) {
    const message = renderTemplate(containerId);
    
    // Your custom logic here
}
```