from flask import request
import functools
import pymongo
from os import environ

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"
client = pymongo.MongoClient(mongouri)

def authorized(route):
    @functools.wraps(route)
    def decorator(*args, **kwargs):
        database = client.get_database("seating")
        users = database.get_collection("users")
        token_collection = database.get_collection("tokens")

        token = token_collection.find_one({"token": request.headers.get("Authorization", None)})
        if token is None:
            return "Token does not exist or has expired.", 400, {"Content-Type": "text/plain"}
        
        kwargs["user"] = users.find_one({"username": token['username']})
        return route(*args, **kwargs)
    return decorator