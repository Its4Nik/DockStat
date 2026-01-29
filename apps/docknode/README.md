# DockNode

> This package only exports a treaty typing for ElysiaJS.

## Description

DockNodes are remote containers, that access a local path to manage:

- DockStacks
- More to come!

## DockStacks

DockStacks is the way of administering and deploying Container Stacks.
The good thing is, you can just upload any docker-compose.yaml
And it gets converted to a dockstacks compatible format.

### Example API Request

[POST] `/api/stacks`

```json
{
  "name": "Test",
  "yaml": "services:\n\texample:\n\t\timage: example:latest\n\t\tenvironment:\t\n\t\t\t- ENV_VAR_1=Example\n\t\t\t\t- ENV_VAR_2=False",
  "repository": "its4nik/dockstat:dev/apps/dockstore",
  "repoName": "Example App",
  "version": "1.0.0",
  "env": {
    "ENV_VAR_1": "123",
    "ENV_VAR_2": true
  }
}
```

Gets written to `./stacks/${id}/`

```yaml
# docker-compose.yaml
services:
  example:
    image: example:latest
    environment:
      - ENV_VAR_1: ${ENV_VAR_1}
      - ENV_VAR_2: ${ENV_VAR_2}
```

```env
# .env
ENV_VAR_1=123
ENV_VAR_2=true
``

DockStacks also feature:

-
```
