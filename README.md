# Seating

## Install
`poetry install`

`poetry run pre-commit install`

`npm install`

## Committing
`git add .`

`git commit -m {message}`

If pre-commit changes files, do that again

## Required Environment Vars (set in docker-compose.yml)
- MONGO_USR: mongodb username
- MONGO_PASS: mongodb password
- MONGO_PORT: mongodb port
- MONGO_CONTAINER_NAME: container name of mongodb

## Starting Project
`docker build . -t seatingapi && docker compose up --build -d`
