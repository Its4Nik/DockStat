![](/api/attachments.redirect?id=f0ef5b94-2e4c-47a2-9a01-3dd799acb5cf " =708.5x156.25")    ![CC BY-NC 4.0 License](https://img.shields.io/badge/License-CC_BY--NC_4.0-lightgrey.svg " =238x34")


---

# DockStatAPI

Docker monitoring API with real-time statistics, stack management, and plugin support.

## Features

* Real-time container metrics via WebSocket
* Multi-host Docker environment monitoring
* Compose stack deployment/management
* Plugin system for custom logic/notifications
* Historical stats storage (SQLite)
* Swagger API documentation
* Web dashboard (WIP)

## Tech Stack

* **Runtime**: [Bun.sh](http://Bun.sh)
* **Framework**: [Elysia.js](https://elysiajs.com/)
* **Database**: SQLite (WAL mode)
* **Docker**: dockerode + compose
* **Monitoring**: Custom metrics collection
* **Auth**: @[Authentication](mention://617454ef-6ae8-4c3a-84fa-647eb1abfce0/document/793112f8-b6d8-4e92-a20d-395995e84486)

## Available Sub-documentations

* @[Database](mention://b382c8c6-ab6c-44ad-9bdf-451b2ce3e43d/document/9d7c53bf-b335-4567-a4cc-76388a903020)
* @[Plugin Development](mention://f75c05ac-5a28-40cf-bb1f-18647bf19863/document/a2b23dbc-0f70-49ef-ad33-73e8421860c7)
* @[WebSocket](mention://34f980da-0847-44eb-b1b0-249fa97a7100/document/5a552211-a8fa-44ce-b816-de587a5caa64)
* @[Stacks](mention://ca071e6e-50de-4657-a4e8-21a68f8a9a3d/document/970cdf56-b108-4468-8d8a-4c9b7d71c2c3)
* @[Contribute](mention://69b30c0c-70b0-4c10-90cc-6e9b97bc8bf1/document/19ddc854-ab6c-4d8b-93e7-9f8d2ced1a56)
* @[Background Tasks](mention://402af320-c981-4578-86aa-8d1497e4437e/document/3e9d366d-9001-4448-bad8-30f5ff4eb784)
* @[Authentication](mention://0777d07f-1cc2-435e-a712-4262a6595950/document/793112f8-b6d8-4e92-a20d-395995e84486)

## Quick Start

```bash
# Clone the Repo
git clone git@github.com:Its4Nik/DockStatAPI.git

# Install Dependencies
bun install

# Start the Server
bun start

# Access endpoints
curl http://localhost:3000/health
```

## Configuration

Set via API endpoints or initial DB setup:

* Data retention policies
* Docker host connections

## API Documentation

Available at `/swagger` when running:

 ![Swagger](/api/attachments.redirect?id=5cbf821a-7899-499f-9d1b-8bf938aa3107)

## Development

Please see @[Contribute](mention://b08a3fa6-ab85-4684-a9e7-e0a93018c689/document/19ddc854-ab6c-4d8b-93e7-9f8d2ced1a56)


---

## Screenshots

 ![Swagger](/api/attachments.redirect?id=966f40a2-55e5-44d0-a0aa-86fa656ff804)


---

 ![Swagger - GET /docker-config/hosts](/api/attachments.redirect?id=6cb14d19-882e-4c96-8809-2709354216e0)


---

 ![SQLite Web](/api/attachments.redirect?id=2254c3a7-7d9f-4cda-bab3-cf7dbca364e7)    ![SQLite Web - Content Viewer](/api/attachments.redirect?id=a0bdd96c-5de8-4139-8b1a-679629344c0b)


---

 ![Custom 404 Error page](/api/attachments.redirect?id=256f9147-4b4f-4e1d-a395-ca8303435986 " =1208x806")


---

## Project Structure Graph

 ![](https://raw.githubusercontent.com/Its4Nik/DockStatAPI/refs/heads/dev/dependency-graph.svg)