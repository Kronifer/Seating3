from functools import wraps
from os import environ

import pymongo
import time
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


rate_table = {

}

def rate_limited(func):

    @wraps(func)
    def inner(*args):
        user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

        limits = rate_table.get(request.path, {}) # {"1.1.1.1":[time.time(), time.time(), time.time()]}
            
        time_period = 30
        request_limit = 5

        ip_limits = limits.get(user_ip, [])
            

        for i in range(len(ip_limits))[::-1]:
            ts = ip_limits[i]
            if ts+time_period < time.time():
                   del ip_limits[i]

        if len(ip_limits) > request_limit:
            return "You have been Rate Limited", 429, {"Content-Type":"text/plain"}
            
        ip_limits.append(time.time())


        limits[user_ip] = ip_limits
        rate_table[request.path] = limits

        print(rate_table)

        return func(*args)
    return inner
