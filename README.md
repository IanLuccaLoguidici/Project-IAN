# Project-IAN

Backend API built with **NestJS** using **CQRS architecture** and **MongoDB**.

## Stack

* NestJS
* TypeScript
* MongoDB
* CQRS
* Repository Pattern
* Node.js

## Architecture

This project follows:

* **CQRS (Command Query Responsibility Segregation)**
* **Repository Pattern**
* **Modular NestJS structure**

Typical module structure:

```
src
 ├── modules
 │   ├── users
 │   │   ├── commands
 │   │   ├── queries
 │   │   ├── handlers
 │   │   ├── repositories
 │   │   ├── schemas
 │   │   └── users.module.ts
 ├── shared
 ├── config
 └── main.ts
```

## Installation

```bash
npm install
```

Run the project:

```bash
npm run start:dev
```

## Environment variables

Example `.env`:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/project-db
```

## Trello board

Project management:

[Trello Board Link](https://trello.com/b/ExtiKR3h/project-ian)

## Repository access

This repository is **private**.
Access is granted through GitHub collaborators.

## License

MIT
