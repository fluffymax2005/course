docker desktop start

cd ../Presentation/Docker/DockerCompose
docker-compose -f docker-compose.ui.yml down
docker-compose -f docker-compose.ui.yml up --build -d
