docker build . -f Dockerfile.postfix -t seatingmail
docker build . -f Dockerfile -t seatingapi
docker compose down
docker compose up --build
