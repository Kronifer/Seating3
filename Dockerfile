FROM python:3.13-alpine
WORKDIR /srv
RUN apk add gcc python3-dev musl-dev linux-headers
RUN pip install poetry
COPY pyproject.toml /srv
COPY poetry.lock /srv
RUN poetry install --no-ansi --no-interaction
COPY ./src /srv/src
EXPOSE 8000
ENTRYPOINT ["poetry", "run", "gunicorn", "--bind=:8000", "--access-logfile", "-", "--error-logfile", "-", "src.api.app:app"]
