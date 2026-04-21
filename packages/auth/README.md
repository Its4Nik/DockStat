# @dockstat/auth

> `@dockstat/auth` is a comprehensive OIDC/OAuth proxy service built for ElysiaJS applications. It provides seamless integration with various OIDC/OAuth providers including Authentik, Google, GitHub, Microsoft, Keycloak, and Okta. The library handles the complete OAuth 2.0 authorization code flow with PKCE (Proof Key for Code Exchange) for enhanced security.

## Description

`@dockstat/auth` acts as an OIDC proxy for ElysiaJS applications, simplifying the integration of multiple authentication providers. It manages provider configurations, handles OAuth flows, and issues secure JWT tokens for authenticated sessions.

### Key Features

- **Multi-provider support**: Configure and manage multiple OIDC/OAuth providers dynamically
- **PKCE flow**: Enhanced security using Proof Key for Code Exchange
- **SQLite persistence**: Store provider configurations in a local database
- **JWT token generation**: Issue secure JWT tokens (HS256, 5-minute expiry) for authenticated sessions
- **ElysiaJS integration**: Native Elysia framework support with typed routes
- **Comprehensive logging**: Detailed logging for debugging and monitoring
- **OIDC discovery**: Automatic discovery of provider configurations via OpenID Connect Discovery
- **Configuration caching**: Cache OIDC configurations for improved performance

## Prerequisites

Before using `@dockstat/auth`, ensure you have the following installed:

- **Bun** v1.3.10 or later
- **TypeScript** v5 or later
- **Elysia** framework
- A running SQLite database instance (via `@dockstat/sqlite-wrapper`)
- A logger instance (via `@
dockstat/logger`)

### Environment Variables

Configure the following environment variables:

```bash
# Base URL where the auth service is running
BASE_URL=http://localhost:3030/api/v2/auth

# Frontend URL for callback redirects
FRONTEND_URL=http://localhost:5173

# Secret key for JWT signing (CHANGE IN PRODUCTION)
JWT_SECRET=your-secret-key-change-in-production
```

##
 API Reference

### Main Export

#### `AuthHandler`

The main class exported by the library.

```typescript
class AuthHandler {
  constructor(db: DB, logger: Logger)
  table: QueryBuilder<ProvidersTable>
  logger: Logger
  issuerCache: Map<string, client.Configuration>
  
  getConfig(providerId: string): Promise<OAuthConfig>
  routes: Elysia
}
```

### Database Schema

The library automatically creates an `oidc-providers` table with the following schema:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | string | UUID (auto-generated) | Provider unique identifier |
| issuer_url | string | NOT NULL | OIDC provider issuer URL |
| client_id | string | NOT NULL | OAuth client ID |
| client_secret | string |
 NOT NULL | OAuth client secret |
| scopes | string | DEFAULT "openid profile email" | OAuth scopes |
| logout_url | string | NOT NULL | Provider logout endpoint URL |
| created_at | Date | Auto-generated | Timestamp of creation |

### Endpoints

All endpoints are prefixed with `/auth`.

#### Provider Management

##### `GET /auth/providers`

List all configured OAuth/OIDC providers.

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "issuer_url": "https://accounts.google.com",
    "client_id": "your-client-id.apps.googleusercontent.com",
    "scopes": "openid profile email",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

##### `POST /auth/providers`

Register a new OAuth/OIDC provider.

**Request Body:**
```json
{
  "client_id": "your-client-id.apps.googleusercontent.com",
  "client_secret": "your-client-secret",
  "issuer_url": "https://accounts.google.com",
  "scopes": "openid profile email",
  "logout_url": "https://accounts.google.com/logout"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "client_id": "your-client-id.apps.googleusercontent.com",
  "issuer_url": "https://accounts.google.com",
  "scopes": "openid profile email",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Authentication Flow

##### `GET /auth/:providerId/login`

Initiate the OAuth 2.0 authorization code flow with PKCE.

**Parameters:**
- `providerId` (path): The UUID of the configured provider

**Behavior:**
- Generates state, nonce, and PKCE code verifier
- Sets secure HTTP-only cookies (valid for 10 minutes)
  - `state`: CSRF protection token
  - `nonce`: Replay protection token
  - `pkce`: PKCE code verifier
- Redirects user to the provider's authorization endpoint

##### `GET /auth/:providerId/callback`

Handle the OAuth callback from the provider.

**Parameters:**
- `providerId` (path): The UUID of the configured provider
- `code` (query): Authorization code from the provider
- `state` (query): State parameter for CSRF protection

**Behavior:**
- Validates state parameter against cookie value
- Exchanges authorization code for access tokens using PKCE
- Fetches user information from the provider's userinfo endpoint
- Generates JWT token (HS256, 5-minute expiry) containing user data
- Redirects to frontend callback URL with token in query string
- Clears OAuth security cookies

**Frontend Callback URL:**
```
{FRONTEND_URL}/auth/{providerId}/callback?token={jwt_token}
```

**Error Responses:**
- `400`: Invalid state or missing security cookies
- `500`: Token exchange failure

##### `GET /auth/:providerId/logout`

Initiate logout and redirect to the provider's logout endpoint.

**Parameters:**
- `providerId` (path): The UUID of the configured provider
- `redirectUri` (query): URL to redirect to after logout

**Behavior:**
- Uses configured `logout_url` if provided
- Falls back to OIDC end session endpoint
- Includes post-logout redirect URI

**Example:**
```
GET /auth/550e8400-e29b-41d4-a716-446655440000/logout?redirectUri=http://localhost:5173/
```

## Usage

### Quick Example

#### Backend Setup

Initialize the AuthHandler and register routes with your Elysia application:

```typescript
import { AuthHandler as AuthHandlerFactory } from "@dockstat/auth"
import { DockStatDB } from "./database"
import BaseLogger from "./logger"
import Elysia from "elysia"

// Initialize the AuthHandler with database and logger
export const AuthHandler = new AuthHandlerFactory(
  DockStatDB._sqliteWrapper, 
  BaseLogger
)

// Register the auth routes with your Elysia app
const app = new Elysia()
  .use(AuthHandler.routes)
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
```

#### Adding a Provider

Add a new OAuth provider to the database:

```typescript
// Add a new OAuth provider
await AuthHandler.table.insert({
  client_id: "your-client-id.apps.googleusercontent.com",
  client_secret: "your-client-secret",
  issuer_url: "https://accounts.google.com",
  scopes: "openid profile email",
  logout_url: "https://accounts.google.com/logout"
})
```

#### Frontend Integration (React)

Create a custom hook for authentication:

```typescript
import { useEffect, useState } from "react"

interface User {
  sub: string
  email?: string
  name?: string
  picture?: string
  [key: string]: unknown
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3030/api/v2"

  // Check for existing authentication
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  // Initiate login with a specific provider
  const login = (providerId: string) => {
    localStorage.setItem("auth_redirect", window.location.pathname)
    localStorage.setItem("auth_provider_id", providerId)
    window.location.href = `${API_BASE}/auth/${providerId}/login`
  }

  // Logout
  const logout = () => {
    const providerId = localStorage.getItem("auth_provider_id")
    localStorage.removeItem("user")
    localStorage.removeItem("auth_provider_id")
    const currentUrl = window.location.href
    window.location.href = `${API_BASE}/auth/${providerId}/logout?redirectUri=${currentUrl}`
  }

  return { loading, login, logout, user }
}
```

#### Handling OAuth Callback (React)

Create a callback component to handle the OAuth response:

```typescript
import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router"

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setError("Missing authentication token")
      return
    }

    try {
      // Decode JWT token (payload is base64 encoded)
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )

      const { user } = JSON.parse(jsonPayload)

      if (!user) {
        throw new Error("Invalid token payload")
      }

      // Store user info
      localStorage.setItem("user", JSON.stringify(user))

      // Redirect back to original page
      const redirect = localStorage.getItem("auth_redirect") || "/"
      localStorage.removeItem("auth_redirect")
      navigate(redirect)
    } catch (err) {
      console.error("Auth callback error:", err)
      setError("Failed to process authentication. Please try again.")
    }
  }, [searchParams, navigate])

  if (error) {
    return <div>Error: {error}</div>
  }

  return <div>Completing authentication...</div>
}
```

## Contributing

We welcome contributions to the project! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `bun install`
4. Create a new branch for your feature: `git checkout -b feature/amazing-feature`

### Development

```bash
# Install dependencies
bun install

# Run tests (when available)
bun test
```

### Code Style

- Use TypeScript for all new code
- Follow existing code conventions and patterns
- Add type annotations for all functions and variables
- Write descriptive commit messages
- Include comments for complex logic
- Ensure comprehensive logging is added for new features

### Submitting Changes

1. Ensure all tests pass
2. Update documentation if needed
3. Commit your changes with a clear message
4. Push to your fork
5. Submit a pull request with a description of your changes

### Reporting Issues

When reporting issues, please include:
- A clear description of the problem
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Environment details (OS, Bun version, etc.)
- Any relevant error messages or logs

### License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

For more information, visit the [Monorepo Root](https://github.com/its4nik/dockstat) or contact the maintainers.
