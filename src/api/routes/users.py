import hashlib
import secrets
from os import environ

import pymongo
from dotenv import load_dotenv
from flask import Blueprint, request

load_dotenv()

mongouri = (
    f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@localhost:{environ["MONGO_PORT"]}/?authSource=admin"
)

client = pymongo.MongoClient(mongouri)

users = Blueprint("users", __name__)


@users.route("/users/login", methods=["POST"])
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
    if hash != user["hash"]["string"]:
        return "Invalid password", 400, {"Content-Type": "text/plain"}
    return "OK", 200, {"Content-Type": "text/plain"}  # TODO: BROWSER COOKIES


@users.route("/users/create", methods=["POST"])
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
