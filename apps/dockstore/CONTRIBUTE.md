# Contributing Guide 🤝

-
-
-

## Template Creation Steps 📝

### 1. Create a Directory

### 2. Add `template.json`
Create a `template.json` file with this structure:

```json
{
  "name": "my-app",
  "version": 1,
  "custom": false,
  "source": "https://github.com/your-repo",
  "compose_spec": {
    "services": {
      "app-service": {
        "image": "your-image:tag",
        "ports": ["8080:80"],
        "volumes": ["data:/app"]
      }
    },
    "volumes": {
      "data": {}
    }
  }
}
```

#### Field Explanations
- **`name`**: Unique identifier for your stack (matches directory name).
- **`version`**: Increment this if you update an existing template.
- **`source`**: URL to your project/repo (optional but encouraged).
- **`compose_spec`**: Your Docker Compose configuration in JSON format.

### 3. (Optional) Add an Icon
- Include an SVG or PNG file in your template directory, the name doesn't matter.
- **Requirements**: Square aspect ratio
- When no icon is provided a "/" will be shown in the list

## Example: Nginx Template 🖥️

For a basic Nginx stack, your `template.json` would look like:

```jsonc
{
  "name": "nginx-simple",
  "version": 1,
  "custom": false,
  "source": "https://github.com/Its4Nik/DockStacks",
  "compose_spec": {
    "services": {
      "web": {
        "image": "nginx:latest",
        "ports": ["80:80"]
      }
    }
  }
}
```

## Submitting Your Template 🎯

1. Fork this repository.
2. Commit your changes to a new branch.
3. Open a Pull Request with a description of your template.

We’ll review it promptly! Thank you for making Docker deployments easier for everyone 💙
