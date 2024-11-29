import hashlib
import secrets
from datetime import datetime
from email.message import EmailMessage
from os import environ
from smtplib import SMTP

import pymongo
from flask import Blueprint, request

from ..utils import decorators

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"

client = pymongo.MongoClient(mongouri)

users = Blueprint("users", __name__, url_prefix="/api/users")


@users.route("/login", methods=["POST"])
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
        if not user["verified"]:
            return "Email has not been verified.", 401, {"Content-Type": "text/plain"}
        pwd = request.form["pwd"]
    except KeyError:
        return "Bad Request", 400, {"Content-Type": "text/plain"}
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["hash"]["salt"])).digest().hex()
    tstamp = datetime.now()
    if hash != user["hash"]["string"]:
        return "Invalid password", 400, {"Content-Type": "text/plain"}
    if not user["verified"]:
        if database.get_collection("verify").find_one({"email": user["email"]}) is None:
            with SMTP(environ["POSTFIX_CONN"]) as smtp:
                vcode = "".join([secrets.choice("1234567890") for _ in range(12)])
                while verify.find_one({"code": vcode}) is not None:
                    vcode = "".join([secrets.choice("1234567890") for _ in range(12)])
                msg = EmailMessage()
                msg.set_content(f"Verification Code: {vcode}. It will expire in one hour.")
                msg["Subject"] = "Seating3 Verification Code"
                msg["From"] = f"{environ['POSTFIX_USR']}@{environ['POSTFIX_DOMAIN']}"
                msg["To"] = user["email"]
                smtp.send_message(msg)
                database.get_collection("verify").insert_one(
                    {"email": user["email"], "code": vcode, "createdAt": datetime.now()}
                )
                return (
                    "User has not verified their email. Verification code has been resent.",
                    401,
                    {"Content-Type": "text/plain"},
                )
        else:
            return "User has not verified their email.", 401, {"Content-Type": "text/plain"}
    token = secrets.token_hex(64)
    while database.get_collection("tokens").find_one({"token": token}) is not None:
        token = secrets.token_hex(64)
    database.get_collection("tokens").insert_one({"username": uname, "token": token, "timeCreated": tstamp})
    return {"token": token, "expires_at": int(tstamp.timestamp()) + 3600}, 200, {"Content-Type": "application/json"}


@users.route("/renewtoken", methods=["POST"])
def update_token():
    try:
        database = client.get_database("seating")
        token_collection = database.get_collection("tokens")
    except:
        return "Internal Server Error", 500, {"Content-Type": "text/plain"}
    try:
        if token_collection.find_one({"token": request.headers["Authorization"]}) is None:
            return "Token does not exist or has expired.", 400, {"Content-Type": "text/plain"}
    except KeyError:
        return "Must supply a token to renew.", 400, {"Content-Type": "text/plain"}
    token_collection.find_one_and_update({"token": request.headers["Authorization"]}, {"timeCreated", datetime.now()})
    return "Successfully updated token.", 200, {"Content-Type": "text/plain"}


@users.route("/create", methods=["POST"])
def create_user():
    try:
        database = client.get_database("seating")
        user_collection = database.get_collection("users")
        verify = database.get_collection("verify")
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
        name = request.form["name"]
    except KeyError:
        return "bad request", 400
    salt = secrets.token_bytes(8)
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + salt).digest().hex()
    user_collection.insert_one(
        {
            "username": uname,
            "name": name,
            "email": email,
            "hash": {"algorithm": "SHA512", "salt": salt.hex(), "string": hash},
            "verified": False,
        }
    )
    with SMTP(environ["POSTFIX_CONN"]) as smtp:
        vcode = "".join([secrets.choice("1234567890") for _ in range(12)])
        while verify.find_one({"code": vcode}) is not None:
            vcode = "".join([secrets.choice("1234567890") for _ in range(12)])
        msg = EmailMessage()
        msg.set_content(f"Verification Code: {vcode}. It will expire in one hour.")
        msg["Subject"] = "Seating3 Verification Code"
        msg["From"] = f"{environ['POSTFIX_USR']}@{environ['POSTFIX_DOMAIN']}"
        msg["To"] = email
        smtp.send_message(msg)
        verify.insert_one({"email": email, "code": vcode, "createdAt": datetime.now()})
    return "Successfully created user.", 202, {"Content-Type": "text/plain"}


@users.route("/getuser", methods=["GET"])
@decorators.authenticated
def getuser(user):
    del user["hash"]
    return user


@users.route("/verify", methods=["POST"])
def verify():
    database = client.get_database("seating")
    users = database.get_collection("users")
    verify = database.get_collection("verify")
    try:
        vcode = request.form["vcode"]
        email = request.form["email"]
    except KeyError:
        return "Bad Request", 401, {"Content-Type": "text/plain"}
    code = verify.find_one({"code": vcode})
    if code is None:
        return "The code supplied is invalid or has expired.", 401, {"Content-Type": "text/plain"}
    if code["email"] != email:
        return "The email supplied does not match the supplied code.", 401, {"Content-Type": "text/plain"}
    users.find_one_and_update({"email": email}, {"verified": True})
    verify.find_one_and_delete({"code": vcode})
    return "Successfully verified user.", 201, {"Content-Type": "text/plain"}
