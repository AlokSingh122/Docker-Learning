## 1. Final Architecture

### Local development

React frontend and Flask backend are containerized as separate Docker images. Amazon ECR stores the images, and Amazon ECS Fargate runs the frontend and backend as separate services in the `virtue-learning-cluster` cluster. CloudWatch Logs collects the container logs.

### Networking model

The React application runs in the user's browser. The browser reaches the frontend task and separately calls the backend task through the backend's public endpoint. The ECS services do not communicate through the Docker Compose service name `backend`.

## 2. Project Structure

```text
docker-compose-learning/
├── compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── App.jsx
└── backend/
    ├── Dockerfile
    ├── app.py
    └── requirements.txt
```

## 3. Backend Application

The Flask backend exposes `/`, `/save`, and `/data`. It creates `/app/data` and stores saved data in `data.txt`. The server listens on all interfaces on port `5000`.

```python
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

## 4. Test Locally with Docker Compose

The frontend is available on host port `3000` and listens on container port `5173`. The backend uses port `5000` on both the host and container. Compose also defines a bridge network and a named volume for backend data.

Run this from the project root:

```sh
docker compose -f compose.yml up --build
```

## 5. Build Docker Images

```sh
docker build -t ecslearning/docker-compose-learning-backend:latest ./backend
docker build -t ecslearning/docker-compose-learning-frontend:latest ./frontend
docker images
```

## 6. Create ECR Repositories

Create two Amazon ECR repositories:

- `docker-compose-learning-backend`
- `docker-compose-learning-frontend`

The AWS account and region used for this learning setup are account `137631563920` and region `ap-south-1`.

## 7. Log In to ECR and Push Images

Authenticate Docker with ECR, tag the images, and push them:

```sh
aws ecr get-login-password --region ap-south-1 |
  docker login --username AWS --password-stdin 137631563920.dkr.ecr.ap-south-1.amazonaws.com

docker tag ecslearning/docker-compose-learning-backend:latest \
  137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-backend:latest
docker tag ecslearning/docker-compose-learning-frontend:latest \
  137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-frontend:latest

docker push 137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-backend:latest
docker push 137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-frontend:latest
```

## 8. Create the ECS Cluster

Create or use an ECS cluster named `virtue-learning-cluster`. The cluster is the logical grouping for the frontend and backend ECS services.

## 9. Create the Backend Task Definition

Create a Fargate task definition for the backend using `0.25` vCPU, `0.5` GB memory, and container port `5000/TCP`. Configure it to use the backend image from ECR.

A task definition is the blueprint; a running ECS task is an instance launched from that blueprint.

## 10. Create the Backend ECS Service

Create a backend service with desired count `1`. Use Fargate, the existing VPC and subnets, a security group that allows the required TCP port, and enable auto-assign public IP. No load balancer is used in this initial setup.

## 11. Test the Backend

Reach the backend through its public endpoint on port `5000` and test its routes:

```text
http://<BACKEND_PUBLIC_IP>:5000/
http://<BACKEND_PUBLIC_IP>:5000/save
http://<BACKEND_PUBLIC_IP>:5000/data
```

## 12. Create the Frontend Task Definition and Service

Create a separate Fargate task definition and ECS service for the React frontend. Use `0.25` vCPU, `0.5` GB memory, container port `5173/TCP`, and enable auto-assign public IP for learning and testing.

## 13. Connect the Frontend to the Backend

The frontend initially used `localhost:5000`. This worked locally but failed after deployment because `localhost` in a user's browser refers to the user's own machine, not the ECS backend.

Configure the frontend to call the backend ECS public endpoint:

```js
fetch("http://<BACKEND_PUBLIC_IP>:5000/save");
fetch("http://<BACKEND_PUBLIC_IP>:5000/data");
```

The frontend's `VITE_API_BASE_URL` setting can be used to configure the browser-reachable backend endpoint.

## 14. Rebuild, Tag, Push, and Redeploy the Frontend

Build and push the updated frontend image:

```sh
docker build -t ecslearning/docker-compose-learning-frontend:latest ./frontend
docker tag ecslearning/docker-compose-learning-frontend:latest \
  137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-frontend:latest
docker push 137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-frontend:latest
```

Pushing a new image to ECR does not automatically replace a running ECS task. Force a new ECS service deployment so that a new task pulls the updated image.

## 15. View CloudWatch Logs

ECS sends container standard output and standard error through the `awslogs` driver to a CloudWatch log group and log stream. The ECS Logs view showed Vite startup output, confirming that container logs were being delivered.

Log groups observed:

- `/ecs/MyTask`
- `/ecs/virtue-learning-1`
- `/ecs/virtue-learning-2`
- `/aws/lambda/demoFunction`
- `RDSOSMetrics`

## 16. Query Logs with CloudWatch Logs Insights

Select a log group and time range in Logs Insights. This query counts log events per minute:

```sql
SOURCE "/ecs/virtue-learning-2"
| fields @timestamp, @message
| stats count(*) as log_events by bin(1m)
| sort @timestamp asc
```

Use the Logs Insights time-range selector to choose a custom start time, such as 5:30 PM onward. `count(*)` counts log events, not necessarily HTTP requests.

## 17. Problems Faced and Solutions

| Problem | Cause | Solution |
| --- | --- | --- |
| Frontend called `localhost:5000` after ECS deployment | Browser `localhost` referred to the user's machine, not the ECS backend. | Changed the React fetch URLs to the backend ECS endpoint and rebuilt and pushed the frontend image. |
| New frontend image was in ECR but the old application still appeared | ECS does not automatically replace a running task when an existing `:latest` tag changes. | Forced a new ECS service deployment so the new task pulled the latest image. |
| Docker Compose network could not be reused directly in ECS | Compose `app-network` is a local Docker network; ECS Fargate uses `awsvpc` networking. | Used separate ECS services and tasks with public endpoints for this learning setup. |
| Backend data persistence was a concern | Compose used `backend-data:/app/data`, but no persistent volume was configured in ECS. | Recognized that Fargate task storage is ephemeral in this setup. EFS is a future option for persistent shared storage. |
| Flask needed to be reachable outside its container | The server must bind to an externally reachable container interface. | Used `host="0.0.0.0"` and port `5000`. |
| Frontend container needed to be reachable | Vite must listen on an external interface inside the container. | Used `vite --host 0.0.0.0`. |
| ECS tasks needed to be accessed directly for learning | No Application Load Balancer was used initially. | Enabled public IPs and opened the required security-group ports for testing. |
| CloudWatch counts were mistaken for request counts | `count(*)` counts log events, not necessarily HTTP requests. | Add application request logging when measuring actual request traffic. |

## 18. Key Concepts Learned

| Concept | Meaning |
| --- | --- |
| Dockerfile | Instructions for building an image. |
| Image | Packaged, immutable application artifact. |
| Container | Running instance of an image. |
| Docker Compose | Local multi-container orchestration. |
| ECR | AWS container image registry. |
| ECS cluster | Logical grouping of ECS resources. |
| Task definition | Blueprint describing how a task or container should run. |
| Task | Running workload created from a task definition. |
| Service | Maintains the desired number of running tasks and manages deployments. |
| Fargate | AWS-managed compute for ECS without managing EC2 servers. |
| Security group | Virtual firewall controlling network traffic. |
| `awsvpc` | ECS networking mode in which tasks receive their own network interfaces. |
| CloudWatch Logs | Centralized destination for application and container logs. |
| Logs Insights | Query and analysis interface for CloudWatch logs. |

## 19. Current Project State

Completed:

- React frontend containerized
- Flask backend containerized
- Docker Compose tested
- ECR repositories created
- Docker images pushed to ECR
- ECS Fargate cluster created
- Backend task definition and service created
- Frontend task definition and service created
- Frontend connected to backend
- CloudWatch container logs available
- Logs Insights introduced

Not yet implemented:

- Application Load Balancer
- Private backend
- ECS Service Discovery
- EFS persistent storage
- ECS Service Auto Scaling
- GitHub Actions to ECR to ECS CI/CD
- HTTPS with ALB and ACM

## 20. Recommended Next Steps

1. Add real HTTP request logging.
2. Analyze request and error traffic in CloudWatch Logs Insights.
3. Intentionally stop a task and observe ECS self-healing.
4. Increase the desired task count from `1` to `2`.
5. Create task definition revisions.
6. Add an Application Load Balancer.
7. Remove direct public exposure of the backend.
8. Add EFS if persistent `/app/data` storage is required.
9. Configure ECS Service Auto Scaling.
10. Automate ECR-to-ECS deployment with GitHub Actions.

## 21. Practical Troubleshooting Checklist

### Frontend does not open

- Check that the ECS task is `RUNNING`.
- Check the public IP.
- Check security-group access to port `5173`.
- Check that Vite is listening on `0.0.0.0`.
- Check CloudWatch startup logs.

### Backend is not reachable

- Check that the ECS task is `RUNNING`.
- Check the public IP.
- Check security-group access to port `5000`.
- Check that Flask uses `0.0.0.0:5000`.
- Check backend CloudWatch logs.

### New frontend code is not visible

- Rebuild the image.
- Tag the image.
- Push the image to ECR.
- Force a new ECS service deployment.
- Hard-refresh the browser or disable its cache while testing.

### Data disappears after a task replacement

- This is expected with the current ephemeral `/app/data` setup.
- Use EFS for persistent storage when needed.

### Logs Insights shows unexpected counts

- Remember that `count(*)` counts log events.
- Add application request logging to measure actual requests.
