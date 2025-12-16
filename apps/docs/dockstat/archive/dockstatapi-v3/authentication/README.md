---
id: 793112f8-b6d8-4e92-a20d-395995e84486
title: Authentication
collectionId: b4a5e48f-f103-480b-9f50-8f53f515cab9
parentDocumentId: f33a7ed1-f6f9-48f9-a393-e150feb09d2f
updatedAt: 2025-12-16T17:25:56.680Z
urlId: VSGhxqjtXf
---

# Overview

* **API Key Header**: `x-api-key`
* **Security**: Keys are hashed using Bun's secure password hashing
* **Bypass**: Authentication is skipped in non-production environments (***NODE_ENV !== "production"***)

# Getting Started


1. **Default Key**:
   * Initial API key is `changeme` (change immediately in production)
   * Update via `/config/update` endpoint
2. **Using the API**:

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/config
# or for websocat:
websocat -H='x-api-Key: YOUR_API_KEY' ws://localhost:3000/docker/stats
```

# Security Best Practices

* 🔑 Rotate keys regularly using the config endpoint
* 🔒 Always use HTTPS in production
* 🗑️ Never commit actual API keys to version control
* 🛡️ Store keys securely using environment variables/secrets management

# Development Notes

* Authentication is disabled during development
* All routes are accessible without an API key
* Set `NODE_ENV=production` to enable auth validation

## Swagger Documentation

Access interactive API docs at `/swagger` with:

* Built-in auth scheme configuration
* Endpoint-specific security requirements
* Testing capabilities with API key input

# Error Handling

Common responses include:

* `401 Unauthorized`: Missing/invalid API key
* `500 Internal Server Error`: Authentication system failure


:::warning
Always change the default API key before deploying to production!

:::