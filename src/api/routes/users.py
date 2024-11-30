import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request

from ..utils import decorators
from ..utils.funcs import send_email

users = Blueprint("users", __name__, url_prefix="/api/users")


@users.route("/login", methods=["POST"])
@decorators.access_database("users", "verify", "tokens")
def login_user(db):
    uname = request.form.get("username")
    pwd = request.form.get("pwd", None)
    if not all([uname, pwd]):
        return "Bad Request", 400, {"Content-Type": "text/plain"}
    user = db["users"].find_one({"username": uname})
    if user is None:
        return "Username does not exist.", 400, {"Content-Type": "text/plain"}
    if not user["verified"]:
        return "Email has not been verified.", 401, {"Content-Type": "text/plain"}
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["hash"]["salt"])).digest().hex()
    tstamp = datetime.now()
    if hash != user["hash"]["string"]:
        return "Invalid password", 400, {"Content-Type": "text/plain"}
    if not user["verified"]:
        if db["verify"].get_collection("verify").find_one({"email": user["email"]}) is None:
            vcode = "".join([secrets.choice("1234567890") for _ in range(6)])
            while verify.find_one({"code": vcode}) is not None:
                vcode = "".join([secrets.choice("1234567890") for _ in range(6)])
            send_email(
                f"{environ['POSTFIX_USR']}@{environ['POSTFIX_DOMAIN']}",
                user["email"],
                "Seating3 Verification Code",
                f"Verification Code: {vcode}. It will expire in one hour.",
            )
            db["verify"].insert_one({"email": user["email"], "code": vcode, "createdAt": datetime.now()})
            return (
                "User has not verified their email. Verification code has been resent.",
                401,
                {"Content-Type": "text/plain"},
            )
        else:
            return "User has not verified their email.", 401, {"Content-Type": "text/plain"}
    token = secrets.token_hex(64)
    while db["tokens"].find_one({"token": token}) is not None:
        token = secrets.token_hex(64)
    db["tokens"].insert_one({"username": uname, "token": token, "timeCreated": tstamp})
    return {"token": token, "expires_at": int(tstamp.timestamp()) + 3600}, 200, {"Content-Type": "application/json"}


@users.route("/renewtoken", methods=["POST"])
@decorators.access_database("tokens")
def update_token(db):
    token = request.headers.get("Authorization", None)
    if token is None:
        return "Must supply a token to renew.", 400, {"Content-Type": "text/plain"}
    if db["tokens"].find_one({"token": request.headers["Authorization"]}) is None:
        return "Token does not exist or has expired.", 400, {"Content-Type": "text/plain"}
    db["tokens"].update_one({"token": request.headers["Authorization"]}, {"$set": {"timeCreated": datetime.now()}})
    return "Successfully updated token.", 200, {"Content-Type": "text/plain"}


@users.route("/create", methods=["POST"])
@decorators.access_database("users", "verify")
def create_user(db):
    uname = request.form.get("username", None)
    pwd = request.form.get("pwd", None)
    name = request.form.get("name", None)
    if not all([uname, pwd, name]):
        return "Bad Request", 400, {"Content-Type": "text/plain"}
    if db["users"].find_one({"username": uname}) is not None:
        return "Username already exists.", 400, {"Content-Type": "text/plain"}
    email = request.form["email"]
    if db["users"].find_one({"email": email}) is not None:
        return "Email already exists.", 400, {"Content-Type": "text/plain"}
    salt = secrets.token_bytes(8)
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + salt).digest().hex()
    db["users"].insert_one(
        {
            "username": uname,
            "name": name,
            "email": email,
            "hash": {"algorithm": "SHA512", "salt": salt.hex(), "string": hash},
            "verified": False,
        }
    )
    vcode = "".join([secrets.choice("1234567890") for _ in range(6)])
    while db["verify"].find_one({"code": vcode}) is not None:
        vcode = "".join([secrets.choice("1234567890") for _ in range(6)])
    send_email(
        f"{environ['POSTFIX_USR']}@{environ['POSTFIX_DOMAIN']}",
        email,
        "Seating3 Verification Code",
        f"Verification Code: {vcode}. It will expire in one hour.",
    )
    db["verify"].insert_one({"email": email, "code": vcode, "createdAt": datetime.now(), "scope": "email"})
    return "Successfully created user.", 202, {"Content-Type": "text/plain"}


@users.route("/getuser", methods=["GET"])
@decorators.authenticated
def getuser(user):
    del user["hash"]
    del user["_id"]
    del user["verified"]
    return user


@users.route("/verifyemail", methods=["POST"])
@decorators.access_database("seating", "users", "verify")
def verify(db):
    code = request.form.get("code")
    email = request.form.get("pwd")
    if not all([code, email]):
        return "Bad Request", 401, {"Content-Type": "text/plain"}
    code = db["verify"].find_one({"code": code})
    if code is None or code["scope"] != email:
        return "The code supplied is invalid or has expired.", 401, {"Content-Type": "text/plain"}
    if code["email"] != email:
        return "The email supplied does not match the supplied code.", 401, {"Content-Type": "text/plain"}
    db["users"].update_one({"email": email}, {"$set": {"verified": True}})
    db["verify"].find_one_and_delete({"code": code})
    return "Successfully verified user.", 201, {"Content-Type": "text/plain"}


@users.route("/resetpassword", methods=["POST"])
@decorators.access_database("verify", "users")
def resetpass(db):
    email = request.form.get("email", None)
    if email is None:
        return "Bad Request", 400, {"Content-Type": "text/plain"}
    code = request.form.get("code", None)
    if code is None:
        if db["users"].find_one({"email": email}) is not None:
            vcode = "".join([secrets.choice("1234567890") for _ in range(6)])
            while db["verify"].find_one({"code": vcode}) is not None:
                vcode = "".join([secrets.choice("1234567890") for _ in range(6)])
            send_email(
                f"{environ['POSTFIX_USR']}@{environ['POSTFIX_DOMAIN']}",
                email,
                "Seating3 Password Reset Code",
                f"Password Reset Code: {vcode}. It will expire in one hour.",
            )
            db["verify"].insert_one(
                {"email": email, "code": vcode, "createdAt": datetime.now(), "scope": "passwordReset"}
            )
        return "Sent code to reset password if email exists in database.", 400, {"text/plain"}
    else:
        code = db["verify"].find_one({"code": code})
        if code is None or code["scope"] != "passwordReset":
            return "The code supplied is invalid or has expired.", 401, {"Content-Type": "text/plain"}
        if code["email"] != email:
            return "The email supplied does not match the supplied code.", 401, {"Content-Type": "text/plain"}
        pwd = request.form.get("pwd", None)
        if pwd is None:
            return "Bad Request", 400, {"Content-Type": "text/plain"}
        else:
            user = db["users"].find_one({"email": email})
            hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["salt"])).digest().hex()
            h = user["hash"]
            h["string"] = hash
            db["users"].update_one({"email": email}, {"$set": {"hash": h}})
            return "Updated password.", 200, {"Content-Type": "text/plain"}
