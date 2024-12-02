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
        return {"status": "error", "msg": "must supply an auth token"}, 401, {"Content-Type": "application/json"}
    if db["tokens"].find_one({"token": request.headers["Authorization"]}) is None:
        return {"status": "error", "msg": "invalid token"}, 401, {"Content-Type": "application/json"}
    db["tokens"].update_one({"token": request.headers["Authorization"]}, {"$set": {"timeCreated": datetime.now()}})
    return {"status": "success", "msg": "token renewed"}, 200, {"Content-Type": "application/json"}


@users.route("/create", methods=["POST"])
@decorators.access_database("users", "verify")
def create_user(db):
    uname = request.form.get("username", None)
    pwd = request.form.get("pwd", None)
    name = request.form.get("name", None)
    email = request.form.get("email", None)
    if not all([uname, pwd, name]):
        err = []
        if uname is None:
            err.append("username")
        if pwd is None:
            err.append("pwd")
        if name is None:
            err.append("name")
        if email is None:
            err.append("email")
        return (
            {"status": "error", "msg": f"missing field(s): {", ".join(err)}"},
            400,
            {"Content-Type": "application/json"},
        )
    if db["users"].find_one({"username": uname}) is not None:
        return {"status": "error", "msg": "username already exists"}, 409, {"Content-Type": "application/json"}
    if db["users"].find_one({"email": email}) is not None:
        return {"status": "error", "msg": "email already exists"}, 409, {"Content-Type": "application/json"}
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
    return {"status": "success", "msg": "successfully created user"}, 202, {"Content-Type": "application/json"}


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
            return {"status": "error", "msg": "email already in use"}, 409, {"Content-Type": "application/json"}
        updatedFields["email"] = request.form.get("email")
        generate_challenge(request.form.get("email"), "email")
        updatedFields["verified"] = False
    db["users"].update_one({"username": user["username"]}, {"$set": updatedFields})
    return (
        {"status": "success", "msg": "updated user. if email was updated, you will have to reverify"},
        200,
        {"Content-Type": "application/json"},
    )


@users.route("/verifyemail", methods=["POST"])
@decorators.access_database("users", "verify")
def verify(db):
    code = request.form.get("code", None)
    email = request.form.get("email", None)
    if not all([code, email]):
        err = []
        if code is None:
            err.append("code")
        if email is None:
            err.append("email")
        return (
            {"status": "err", "msg": f"missing field(s): {", ".join(err)}"},
            400,
            {"Content-Type": "application/json"},
        )
    code = db["verify"].find_one({"code": code, "email": email})
    if code is None or code["scope"] != "email":
        return {"status": "error", "msg": "code is invalid or expired"}, 401, {"Content-Type": "application/json"}
    db["users"].update_one({"email": email}, {"$set": {"verified": True}})
    db["verify"].delete_one(code)
    return {"status": "success", "msg": "successfully verified email"}, 201, {"Content-Type": "application/json"}


@users.route("/resetpassword", methods=["POST"])
@decorators.access_database("verify", "users", "tokens")
def resetpass(db):
    email = request.form.get("email", None)
    if email is None:
        return {"status": "error", "msg": "missing field: email"}, 400, {"Content-Type": "application/json"}
    code = request.form.get("code", None)
    if code is None:
        if db["users"].find_one({"email": email}) is not None:
            generate_challenge(email, "passwordReset")
        return (
            {"status": "success", "msg": "sent reset code to email if it exists in db"},
            200,
            {"Content-Type": "application/json"},
        )
    else:
        code = db["verify"].find_one({"code": code, "email": email})
        if code is None or code["scope"] != "passwordReset":
            return {"status": "error", "msg": "code is invalid or expired"}, 401, {"Content-Type": "application/json"}
        pwd = request.form.get("pwd", None)
        if pwd is None:
            return {"status": "error", "msg": "missing field: pwd"}, 401, {"Content-Type": "application/json"}
        else:
            user = db["users"].find_one({"email": email})
            hash = hashlib.sha3_512(bytes.fromhex(pwd) + bytes.fromhex(user["hash"]["salt"])).digest().hex()
            h = user["hash"]
            h["string"] = hash
            db["users"].update_one({"email": email}, {"$set": {"hash": h}})
            db["verify"].delete_one(code)
            db["tokens"].delete_many({"username": user["username"]})
            return {"status": "success", "msg": "updated password"}, 200, {"Content-Type": "application/json"}
