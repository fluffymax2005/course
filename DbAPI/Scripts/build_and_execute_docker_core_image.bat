docker desktop start

cd ../Core/Docker/DockerCompose
docker-compose -f docker-compose.core.yml down

docker network rm -f core
docker network rm -f backend

docker network create core
docker network create backend

docker-compose -f docker-compose.core.yml up --build -d