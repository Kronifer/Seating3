import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request
import params.auth as auth

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"
client = pymongo.MongoClient(mongouri)

seating = Blueprint("events", __name__, url_prefix="/api/events")


@auth.authorized
@seating.route("/schedule", methods=["POST"])
def seating_placements():
    database = client.get_database("seating")

    events.insert_one({
        "owner": user['username']
    })