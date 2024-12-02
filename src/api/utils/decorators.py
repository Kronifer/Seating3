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
    @wraps(func)
    def inner(*args):
        db = client.get_database("seating")
        users = db.get_collection("users")
        tokens = db.get_collection("tokens")

        token = request.headers.get("Authorization", None)
        if token is None:
            return {"status": "error", "msg": "this endpoint requires authorization"}, 401, {"Content-Type": "application/json"}
        token = tokens.find_one({"token": token})
        if token is None:
            return {"status": "error", "msg": "the supplied token is invalid or expired"}, 401, {"Content-Type": "application/json"}
        user = users.find_one({"username": token.get("username")})
        if user is None:
            return (
                    {"status": "error", "msg": "the token supplied is valid but the user associated with it does not exist or has been deleted"},
                401,
                {"Content-Type": "application/json"},
            )
        if not user["verified"]:
            return {"status": "error", "msg": "this user has not verified their email"}, 401, {"Content-Type": "application/json"}
        return func(user, *args)

    return inner
