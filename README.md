# Seating

## Install
`poetry install`

`poetry run pre-commit install`

`npm install`

## Committing
`git add .`

`git commit -m {message}`

If pre-commit changes files, do that again

## Required Environment Vars (make a root .env file)
- MONGO_USR: mongodb username
- MONGO_PASS: mongodb password
- MONGO_PORT: mongodb port

## Starting Database
Replace environment variables in .env and docker-compose.yml to your liking, then run
`docker compose up --build`

## Starting Site
`poetry run task run-server`
