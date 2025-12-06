docker desktop start

cd ../Infrastructure/Docker/DockerCompose
docker-compose -f docker-compose.infrastucture.yml down

docker network rm -f infrastructure
docker network create infrastructure

docker-compose -f docker-compose.infrastucture.yml up --build -d