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

#### Backend Setup with Authentication Middleware

The `@dockstat/auth` package now includes comprehensive authentication middleware for ElysiaJS. This middleware automatically validates JWT tokens and attaches user information to request contexts.

**Initialize the AuthHandler and middleware:**

```typescript
import { AuthHandler as AuthHandlerFactory, createAuthMiddleware } from "@dockstat/auth"
import { DockStatDB } from "./database"
import BaseLogger from "./logger"
import Elysia from "elysia"

// Initialize the AuthHandler with database and logger
export const AuthHandler = new AuthHandlerFactory(
  DockStatDB._sqliteWrapper, 
  BaseLogger
)

// Create authentication middleware
const authMiddleware = createAuthMiddleware()

// Create the Elysia app with authentication
const app = new Elysia()
  .use(authMiddleware)
  .use(AuthHandler.routes)
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
```

**Protecting Routes:**

There are multiple ways to protect your routes:

**Option 1: Using the `authenticated()` decorator**

```typescript
const app = new Elysia()
  .use(createAuthMiddleware())
  .get("/protected", () => {
    return "This route is protected"
  }, {
    authenticated()
  })
```

**Option 2: Using the macro in route handlers**

```typescript
const app = new Elysia()
  .use(createAuthMiddleware())
  .macro({
    authenticated: {
      authenticated: () => ({
        beforeHandle: ({ isAuthenticated, user, set }) => {
          if (!isAuthenticated) {
            set.status = 401
            return { error: "Authentication required" }
          }
          // User is now available in the handler
          return { user }
        }
      })
    }
  })
  .get("/protected", ({ user }) => {
    return `Hello, ${user.name}!`
  }, {
    beforeHandle: ({ isAuthenticated, set }) => {
      if (!isAuthenticated) {
        set.status = 401
        return { error: "Authentication required" }
      }
    }
  })
```

**Option 3: Checking authentication manually in handlers**

```typescript
const app = new Elysia()
  .use(createAuthMiddleware())
  .get("/protected", ({ isAuthenticated, user }) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated")
    }
    return `Hello, ${user?.name}!`
  })
```

**Accessing User Information:**

The middleware automatically attaches user information to the request context:

```typescript
const app = new Elysia()
  .use(createAuthMiddleware())
  .get("/profile", ({ user }) => {
    return {
      id: user?.sub,
      email: user?.email,
      name: user?.name,
    }
  }, authenticated())
```

**WebSocket Authentication:**

For WebSocket connections, use the `createWsAuthMiddleware`:

```typescript
const app = new Elysia()
  .ws("/ws", {
    ...createWsAuthMiddleware(),
    open: (ws) => {
      const user = ws.data.user
      console.log(`User connected: ${user?.email}`)
    },
    message: (ws, message) => {
      const user = ws.data.user
      ws.send(`Hello, ${user?.name}!`)
    }
  })
```

**Token Sources:**

The middleware looks for JWT tokens in the following order:
1. `Authorization: Bearer <token>` header
2. `auth_token` cookie
3. `?token=<token>` query parameter (for WebSockets)

#### Adding a Provider

Add a new OAuth provider to the database:

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

#### Frontend Integration (React) - New Context-Based Approach

The `@dockstat/auth` package now provides an improved React integration using the Context API for better state management, automatic token refresh, and cross-tab synchronization.

**Setup the AuthProvider:**

Wrap your application with the `AuthProvider`:

```typescript
import { AuthProvider } from "@dockstat/auth/client"
import App from "./App"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3030/api/v2"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider apiBase={API_BASE}>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

**Use the authentication hooks in your components:**

```typescript
import { useAuth, useUser, useIsAuthenticated } from "@dockstat/auth/client"

function Dashboard() {
  const { login, logout, loading, error } = useAuth()
  const user = useUser()
  const isAuthenticated = useIsAuthenticated()

  if (loading) return <div>Loading...</div>

  if (!isAuthenticated) {
    return <button onClick={() => login("google-provider-id")}>Login with Google</button>
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

**Using ProtectedRoute:**

```typescript
import { ProtectedRoute } from "@dockstat/auth/client"
import Dashboard from "./Dashboard"
import Login from "./Login"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute loadingComponent={<Spinner />}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
```

**Available Hooks:**

- `useAuth()`: Full authentication context (user, token, loading, error, login, logout, refreshToken, clearError)
- `useUser()`: Get current user object
- `useIsAuthenticated()`: Check if user is authenticated
- `useIsLoading()`: Check if authentication is loading
- `useAuthError()`: Get authentication error message

**AuthProvider Props:**

```typescript
interface AuthProviderProps {
  children: ReactNode
  apiBase: string                    // Base URL for the API
  tokenStorageKey?: string           // Key for storing token in localStorage (default: "auth_token")
  userStorageKey?: string            // Key for storing user in localStorage (default: "user")
  onTokenExpired?: () => void        // Callback when token expires
}
```

**Automatic Features:**

- **Token Refresh**: Automatically refreshes tokens every 4 minutes (assuming 5-minute token lifetime)
- **Cross-tab Sync**: Keeps authentication state synchronized across browser tabs
- **URL Callback Handling**: Automatically processes OAuth callbacks from the URL
- **Redirect Handling**: Remembers and redirects to the page the user was trying to access

#### Frontend Integration (React) - Legacy Approach (Deprecated)

```typescript
> ⚠️ **DEPRECATED**: The following approach is deprecated. Please migrate to the new Context-based approach described above.

The old hook-based approach has been replaced with a Context-based approach that provides better state management, automatic token refresh, and cross-tab synchronization.

**Legacy Example (Deprecated):**

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

**Migration Guide:**

To migrate from the old hook-based approach to the new Context-based approach:

1. **Wrap your app with AuthProvider:**
   ```typescript
   // Before
   <App />
   
   // After
   <AuthProvider apiBase={API_BASE}>
     <App />
   </AuthProvider>
   ```

2. **Update imports:**
   ```typescript
   // Before
   import { useAuth } from "@dockstat/auth/client/useAuth"
   const { login, logout, user } = useAuth({ API_BASE: "/api" })
   
   // After
   import { useAuth } from "@dockstat/auth/client/AuthProvider"
   const { login, logout, user } = useAuth()
   ```

3. **Update ProtectedRoute:**
   ```typescript
   // Before
   <ProtectedRoute api_base={API_BASE}>
     <Dashboard />
   </ProtectedRoute>
   
   // After
   <ProtectedRoute>
     <Dashboard />
   </ProtectedRoute>
   ```

4. **Use additional hooks for better control:**
   ```typescript
   import { useUser, useIsAuthenticated, useAuthError } from "@dockstat/auth/client"
   
   const user = useUser()
   const isAuthenticated = useIsAuthenticated()
   const error = useAuthError()
   ```

#### Handling OAuth Callback (React)

The new AuthProvider automatically handles OAuth callbacks from the URL. However, you can still create a dedicated callback page if needed:

```typescript
```typescript
import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router"

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // The AuthProvider automatically handles the token from the URL
    // This page is optional - you can set the callback URL to any page in your app
    const token = searchParams.get("token")

    if (!token) {
      navigate("/login", { replace: true })
      return
    }

    // The AuthProvider will process the token and handle the redirect
    // You can optionally show a loading state here
    setTimeout(() => {
      // Check if auth is complete by checking for user in localStorage
      const user = localStorage.getItem("user")
      if (user) {
        navigate("/", { replace: true })
      } else {
        navigate("/login", { replace: true })
      }
    }, 1000)
  }, [searchParams, navigate])

  return <div>Completing authentication...</div>
}
```

## New Exports

### Backend Exports

```typescript
import {
  // Main handler
  AuthHandler,
  
  // Middleware
  createAuthMiddleware,
  authenticated,
  createWsAuthMiddleware,
  getWsUser,
  
  // Types
  type AuthUser,
  type AuthContext,
} from "@dockstat/auth"
```

### Client Exports

```typescript
import {
  // Context Provider
  AuthProvider,
  
  // Hooks (recommended)
  useAuth,
  useUser,
  useIsAuthenticated,
  useIsLoading,
  useAuthError,
  
  // Components
  ProtectedRoute,
  
  // Legacy hooks (deprecated)
  useAuth as useAuthLegacy,
} from "@dockstat/auth/client"
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
