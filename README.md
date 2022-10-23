# ViewPoint
A backend implementation for storing and displaying commissioned artworks. This project started as a personal project for storing my commissions
but after several others had asked me about the project (and an extensive refactoring effort), I decided to publish the entire backend for my [site](https://deers.io)
to allow others to get some use out of my code!

## Dependencies
This backend requires several services to be connected to the application to properly work

- Minio
  - Minio is selfhosted S3 instance for object storage. This could be replaced with any other service that implements the S3 protocol.
- Postgres
  - Relational database used to store all information regarding commissions, entities, and files
- Redis
  - Session manager for authentication

## Configuration
### Env Vars
These are required environment variables
- `DATABASE_URL` -> postgres connection URI
- `MINIO_ACCESS_KEY` -> string
- `MINIO_SECRET_KEY` -> string
- `MINIO_HOST` -> string
- `MINIO_PORT` -> number
- `REDIS_URL` -> redis connection URI

### Setup
To setup the project once you have cloned it
1. Install all project dependencies with `pnpm i`
2. Generate necessary database data with `pnpx prisma migrate dev`
3. Run `pnpm dev` to start the development server

## Accessing Data
### Backend
The most direct way to interface with the data is via the data controllers. Stored in `controllers`, these include methods for CRUD operations for commissions, entities, and users.

### API
The API layer uses the controllers mentioned above, but abstracted through a set of network requests. This is useful for making raw network requests to modify the database state.

### React Hooks
Bundled in `hooks` is a set of stateful react components for modifying the database and information therein. For doing any types of queries on the frontend, this is the recommended
method for interaction.
