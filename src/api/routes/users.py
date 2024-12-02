import hashlib
import secrets
from datetime import datetime
from os import environ

from flask import Blueprint, request

from ..utils import decorators
from ..utils.emails import generate_challenge

users = Blueprint("users", __name__, url_prefix="/api/users")


@users.route("/login", methods=["POST"])
@decorators.access_database("users", "verify", "tokens")
def login_user(db):
    uname = request.form.get("username", None)
    pwd = request.form.get("pwd", None)
    if not all([uname, pwd]):
        err = []
        if uname is None:
            err.append("username")
        if pwd is None:
            err.append("pwd")
        return (
            {"status": "error", "msg": f"missing field(s): {", ".join(err)}"},
            400,
            {"Content-Type": "application/json"},
        )
    user = db["users"].find_one({"username": uname})
    if user is None:
        return {"status": "error", "msg": "username or password is invalid"}, 401, {"Content-Type": "application/json"}
    hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["hash"]["salt"])).digest().hex()
    tstamp = datetime.now()
    if hash != user["hash"]["string"]:
        return {"status": "error", "msg": "username or password is invalid"}, 401, {"Content-Type": "application/json"}
    if not user["verified"]:
        if db["verify"].get_collection("verify").find_one({"email": user["email"]}) is None:
            generate_challenge(user["email"], "email")
        return (
            {"status": "error", "msg": "email has not been verified"},
            401,
            {"Content-Type": "application/json"},
        )
    token = secrets.token_hex(64)
    while db["tokens"].find_one({"token": token}) is not None:
        token = secrets.token_hex(64)
    db["tokens"].insert_one({"username": uname, "token": token, "timeCreated": tstamp})
    return (
        {"status": "success", "token": token, "expires_at": int(tstamp.timestamp()) + 3600},
        200,
        {"Content-Type": "application/json"},
    )


@users.route("/renewtoken", methods=["POST"])
@decorators.access_database("tokens")
def update_token(db):
    token = request.headers.get("Authorization", None)
    if token is None:
        return {"status": "error", "msg": "must supply an auth token"}, 401, {"Content-Type": "text/plain"}
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
    generate_challenge(email, "email")
    return "Successfully created user.", 202, {"Content-Type": "text/plain"}


@users.route("/getuser", methods=["GET"])
@decorators.authenticated
def getuser(user):
    del user["hash"]
    del user["_id"]
    del user["verified"]
    return user


@users.route("/updateuser", methods=["POST"])
@decorators.access_database("users", "tokens")
@decorators.authenticated
def updateuser(user, db):
    updatedFields = {}
    if request.form.get("username") is not None:
        updatedFields["username"] = request.form.get("username")
        db["tokens"].update_many({"username": user["username"]}, {"$set": {"username": request.form.get("username")}})
    if request.form.get("name") is not None:
        updatedFields["name"] = request.form.get("name")
    if request.form.get("email") is not None:
        if db["users"].find_one({"email": request.form.get("email")}) is not None:
            return "Email already in use.", 400, {"Content-Type": "text/plain"}
        updatedFields["email"] = request.form.get("email")
        generate_challenge(request.form.get("email"), "email")
        updatedFields["verified"] = False
    db["users"].update_one({"username": user["username"]}, {"$set": updatedFields})
    return (
        "Successfully updated user. If you changed your email, you will need to reverify.",
        200,
        {"Content-Type": "text/plain"},
    )


@users.route("/verifyemail", methods=["POST"])
@decorators.access_database("users", "verify")
def verify(db):
    code = request.form.get("code", None)
    email = request.form.get("email", None)
    if not all([code, email]):
        return "Bad Request", 401, {"Content-Type": "text/plain"}
    code = db["verify"].find_one({"code": code})
    if code is None or code["scope"] != "email":
        return "The code supplied is invalid or has expired.", 401, {"Content-Type": "text/plain"}
    if code["email"] != email:
        return "The email supplied does not match the supplied code.", 401, {"Content-Type": "text/plain"}
    db["users"].update_one({"email": email}, {"$set": {"verified": True}})
    db["verify"].delete_one({"code": code})
    return "Successfully verified user.", 201, {"Content-Type": "text/plain"}


@users.route("/resetpassword", methods=["POST"])
@decorators.access_database("verify", "users", "tokens")
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
            generate_challenge(email, "passwordReset")
        return "Sent code to reset password if email exists in database.", 200, {"Content-Type": "text/plain"}
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
            hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["hash"]["salt"])).digest().hex()
            h = user["hash"]
            h["string"] = hash
            db["users"].update_one({"email": email}, {"$set": {"hash": h}})
            db["verify"].delete_one({"code": code["code"]})
            db["tokens"].delete_many({"username": user["username"]})
            return "Updated password.", 200, {"Content-Type": "text/plain"}
