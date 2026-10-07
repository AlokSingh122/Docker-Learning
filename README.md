# Docker Compose Learning

A small full-stack application with a React/Vite frontend and a Flask backend, configured to run together with Docker Compose.

## Project structure

```text
.
├── backend/
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   └── ...
└── compose.yml
```

## Requirements

- Docker Desktop (or Docker Engine) with Docker Compose
- Docker Hub account to publish the images

## Implementation walkthrough

The project was put together in these steps:

1. Set up the Flask backend in `backend/` and the React/Vite frontend in `frontend/`, each with its own Dockerfile.
2. Added a root `.gitignore` for local files and separate `.dockerignore` files so development dependencies and other unnecessary files are excluded from the image build contexts.
3. Configured `compose.yml` to build and run both services, expose the frontend on port `3000` and backend on port `5000`, connect them to a bridge network, and persist backend data in a named volume.
4. Added Docker Hub image tags to the Compose services:
   - `ecslearning/docker-compose-learning-backend:latest`
   - `ecslearning/docker-compose-learning-frontend:latest`
5. Validated the Compose configuration and built both images with Docker Compose.
6. Attempted to push both images to Docker Hub. The push requires signing in as an account with permission to publish to the `ecslearning` namespace; authenticate first, then run the commands in [Docker Hub images](#docker-hub-images).
7. Added this README, then committed and pushed the project to the GitHub `main` branch.

## Run locally

From the project root, build the images and start both services:

```sh
docker compose -f compose.yml up --build
```

Open the frontend at [http://localhost:3000](http://localhost:3000). The Flask API is available at [http://localhost:5000](http://localhost:5000).

The backend provides these routes:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Returns a greeting |
| `GET` | `/save` | Appends a line to the persisted data file |
| `GET` | `/data` | Returns saved data, or a message if there is none |

The backend stores data in the `backend-data` named volume, so it persists when the containers are stopped or recreated.

Stop the services with:

```sh
docker compose -f compose.yml down
```

To also remove the persisted backend data volume:

```sh
docker compose -f compose.yml down --volumes
```

## Docker Hub images

Compose is configured to build and tag these images:

- `ecslearning/docker-compose-learning-backend:latest`
- `ecslearning/docker-compose-learning-frontend:latest`

Sign in to Docker Hub, then build and push both images from the project root:

```sh
docker login
docker compose -f compose.yml build
docker compose -f compose.yml push
```

After the images have been pushed, they can be pulled and started with:

```sh
docker compose -f compose.yml pull
docker compose -f compose.yml up
```

## Push the project to GitHub

To commit subsequent changes and push them to the configured `origin` remote:

```sh
git add .
git commit -m "Describe your changes"
git push -u origin main
```
