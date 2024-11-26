import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request
from ..utils import decorators

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"
client = pymongo.MongoClient(mongouri)

seating = Blueprint("events", __name__, url_prefix="/api/events")


@decorators.authenticated
@seating.route("/schedule", methods=["POST"])
def seating_placements(user):
    database = client.get_database("seating")
    events = database.get_collection("events")
    name = request.form['name']
    event_id = secrets.token_hex(6)
    while events.find_one({"eventId":event_id}) is not None:
        event_id = secrets.token_hex(6)

    events.insert_one({
        "owner": user['username'], 
        "name":name,
        "eventId":event_id,
        "registered":[]
    })

    return "Event successfully created", 201, {"Content-Type":"text/plain"}


@decorators.authenticated
@seating.route("/register")
def register_event(user):
    database = client.get_database("seating")
    events = database.get_collection("events")
    event_id = request.form['eventId']

    event = events.find_one({
        "eventId":event_id
    })

    event['registered'].append(user['username'])

    events.update_one({
        "eventId":event_id
    }, event)

    return "Register successful", 200, {"Content-Type":"text/plain"}

