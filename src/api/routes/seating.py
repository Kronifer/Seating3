import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"
client = pymongo.MongoClient(mongouri)

seating = Blueprint("seating", __name__, url_prefix="/api/seating")



@seating.route("/placements", methods=["GET"])
def seating_placements():
    pass