import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"

client = pymongo.MongoClient(mongouri)

users = Blueprint("users", __name__)


@users.route("/api/users/login", methods=["POST"])
def login_user():
    try:
        database = client.get_database("seating")
        user_collection = database.get_collection("users")
    except:
        return "Internal Server Error", 500, {"Content-Type": "text/plain"}
    try:
        uname = request.form["username"]
        user = user_collection.find_one({"username": uname})
        if user is None:
            return "Username does not exist.", 400, {"Content-Type": "text/plain"}
        pwd = request.form["pwd"]
    except KeyError:
        return "Bad Request", 400, {"Content-Type": "text/plain"}
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["hash"]["salt"])).digest().hex()
    tstamp = datetime.now()
    if hash != user["hash"]["string"]:
        return "Invalid password", 400, {"Content-Type": "text/plain"}
    token = secrets.token_hex(64)
    while database.get_collection("tokens").find_one({"token": token}) is not None:
        token = secrets.token_hex(64)
    database.get_collection("tokens").insert_one({"username": uname, "token": token, "timeCreated": tstamp})
    return {"token": token, "expires_at": int(tstamp.timestamp()) + 3600}, 200, {"Content-Type": "application/json"}


@users.route("/api/users/renewtoken", methods=["POST"])
def update_token():
    try:
        database = client.get_database("seating")
        token_collection = database.get_collection("tokens")
    except:
        return "Internal Server Error", 500, {"Content-Type": "text/plain"}
    try:
        if token_collection.find_one({"token": request.form["token"]}) is None:
            return "Token does not exist or has expired.", 400, {"Content-Type": "text/plain"}
    except KeyError:
        return "Must supply a token to renew.", 400, {"Content-Type": "text/plain"}
    token_collection.find_one_and_update({"token": request.form["token"]}, {"timeCreated", datetime.now()})
    return "Successfully updated token.", 200, {"Content-Type": "text/plain"}


@users.route("/api/users/create", methods=["POST"])
def create_user():
    try:
        database = client.get_database("seating")
        user_collection = database.get_collection("users")
    except:
        return "Internal Server Error", 500, {"Content-Type": "text/plain"}
    try:
        uname = request.form["username"]
        if user_collection.find_one({"username": uname}) is not None:
            return "Username already exists.", 400, {"Content-Type": "text/plain"}
        email = request.form["email"]
        if user_collection.find_one({"email": email}) is not None:
            return "Email already exists.", 400, {"Content-Type": "text/plain"}
        pwd = request.form["pwd"]
    except KeyError:
        return "bad request", 400
    salt = secrets.token_bytes(8)
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + salt).digest().hex()
    user_collection.insert_one(
        {"username": uname, "email": email, "hash": {"algorithm": "SHA512", "salt": salt.hex(), "string": hash}}
    )
    return "Successfully created user", 201, {"Content-Type": "text/plain"}
