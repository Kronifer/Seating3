import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, jsonify, request

from ..utils import decorators
from ..utils.pmath import compute_remaining

seats = Blueprint("seats", __name__, url_prefix="/api/seats")


# {'eventId':'abc213', '}
@seats.route("/reserve", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def reserve_seat(user, db):  # {eventId, tableIndex, partySize}
    events = db["events"]
    event_id = request.get_json().get("eventId", None)
    table_index = request.get_json().get("tableIndex", None)
    party_size = request.get_json().get("partySize", None)
    if any([event_id, table_index, party_size]) is None:
        err = []
        if event_id is None:
            err.append("eventId")
        if table_index is None:
            err.append("tableIndex")
        if party_size is None:
            err.append("partySize")
        return {"status": "error", "msg": f"missing required field(s): {", ".join(err)}"}, 400
    event = events.find_one({"eventId": event_id})

    if event is None:
        return {"status": "error", "msg": "No such event exists"}, 404, {"Content-Type": "text/plain"}

    if user["username"] not in event["registered"].keys():
        return {"status": "error", "msg": "You are not registered for this event"}, 404, {"Content-Type": "text/plain"}

    if table_index < 0 or table_index > len(event["tables"]) - 1:
        return {"status": "error", "msg": "No such table exists"}, 400, {"Content-Type": "text/plain"}

    if compute_remaining(event["registered"], event["tables"], table_index) < party_size:
        return {"status": "error", "msg": "Not enough space"}, 409, {"Content-Type": "text/plain"}

    event["registered"][user["username"]]["party"] = party_size
    event["registered"][user["username"]]["table"] = table_index

    events.update_one(
        {
            "eventId": request.get_json()["eventId"],
        },
        {"$set": {"registered": event["registered"]}},
    )

    return {"status": "success", "msg": "Seat Reserved"}, 201, {"Content-Type": "text/plain"}


@seats.route("/state", methods=["GET"])
@decorators.access_database("events")
@decorators.authenticated
def get_state(user, db):
    events = db["events"]
    event_id = request.args.get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400
    event = events.find_one({"eventId": event_id})

    if event is None:
        return (
            {"status": "error", "msg": "No such event exists, or you are not registered for this event"},
            404,
            {"Content-Type": "text/plain"},
        )

    if user["username"] not in event["registered"].keys():
        return {"status": "error", "msg": "You are not registered for this event"}, 404, {"Content-Type": "text/plain"}

    modMap = [
        (a[0], a[1], compute_remaining(event["registered"], event["tables"], i), a[2])
        for i, a in enumerate(event["tables"])
    ]

    return jsonify(modMap)
