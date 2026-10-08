# ECS Docker Learning Steps

1. Create a React frontend and Flask backend, with the backend providing the home, save-data, and read-data features.
2. Configure Flask to listen on all network interfaces and store application data in `/app/data`.
3. Create Dockerfiles for the frontend and backend, exposing frontend port `5173` and backend port `5000`.
4. Configure Docker Compose to run both containers locally, connect them through a bridge network, and persist backend data with a named volume.
5. Test the complete application locally and confirm that the frontend can save and read data through the backend.
6. Build separate Docker images for the frontend and backend.
7. Create Amazon ECR repositories for the frontend and backend images in AWS account `137631563920`, region `ap-south-1`.
8. Authenticate to Amazon ECR, tag both images for their ECR repositories, and publish them.
9. Create or select the ECS cluster named `virtue-learning-cluster`.
10. Create a Fargate task definition for the backend with `0.25` vCPU, `0.5` GB memory, and container port `5000`.
11. Create a backend ECS service with one task, public IP assignment, and security-group access to port `5000`.
12. Test the backend's home, save-data, and read-data features through its public endpoint.
13. Create a Fargate task definition and ECS service for the frontend with `0.25` vCPU, `0.5` GB memory, and container port `5173`.
14. Configure the frontend to call the backend's public endpoint instead of `localhost`, then publish the updated image as `137631563920.dkr.ecr.ap-south-1.amazonaws.com/docker-compose-learning-frontend:latest`.
15. Force a new frontend service deployment so ECS runs the updated image, then confirm the application works and review its container logs in CloudWatch Logs and Logs Insights.
