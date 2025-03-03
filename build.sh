docker build . -f Dockerfile.postfix -t seatingmail
docker build . -f Dockerfile -t seatingapi
docker build . -f Dockerfile.node -t seatingsite
docker compose down
docker compose up --build -d
