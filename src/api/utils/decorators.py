from functools import wraps
from os import environ

import pymongo
from flask import request

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"

client = pymongo.MongoClient(mongouri)


def access_database(*args):
    def inner(func):
        colls = {i: client.get_database("seating").get_collection(i) for i in args}

        @wraps(func)
        def wrapper():
            return func(colls)

        return wrapper

    return inner


def authenticated(func):
    @wrap(func)
    def inner(*args):
        db = client.get_database("seating")
        users = db.get_collection("users")
        tokens = db.get_collection("tokens")

        token = request.headers.get("Authorization", None)
        if token is None:
            return "This endpoint requires authorization.", 401, {"Content-Type": "text/plain"}
        token = tokens.find_one({"token": token})
        if token is None:
            return "The supplied token is invalid or has expired.", 401, {"Content-Type": "text/plain"}
        user = users.find_one({"username": token.get("username")})
        if user is None:
            return (
                "The token supplied is valid but the user associated with it does not exist or has been deleted.",
                401,
                {"Content-Type": "text/plain"},
            )
        if not user["verified"]:
            return "The user has not yet verified their email.", 401, {"Content-Type": "text/plain"}
        return func(user, *args)

    return inner
