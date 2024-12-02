import secrets
from datetime import datetime
from email.message import EmailMessage
from os import environ
from smtplib import SMTP

import pymongo

from . import decorators


def send_email(from_addr, to_addr, subject, content):
    msg = EmailMessage()
    msg["To"] = to_addr
    msg["From"] = from_addr
    msg["Subject"] = subject
    msg.set_content(content)
    with SMTP(environ["POSTFIX_CONN"]) as s:
        s.send_message(msg)


def generate_challenge(email, scope):
    mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"
    client = pymongo.MongoClient(mongouri)
    verify = client.get_database("seating").get_collection("verify")
    vcode = "".join([secrets.choice("0123456789") for _ in range(6)])
    verify.insert_one({"email": email, "code": vcode, "scope": scope, "createdAt": datetime.now()})
    subject = "Your Seating3 Verification Code" if scope != "passwordReset" else "Your Seating3 Password Reset Code"
    content = (
        f"Verification Code: {vcode}. It will expire in one hour."
        if scope != "passwordReset"
        else f"Password Reset Code: {vcode}. It will expire in one hour."
    )
    send_email(f"{environ['POSTFIX_USR']}@{environ['POSTFIX_DOMAIN']}", email, subject, content)
