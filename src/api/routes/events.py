import hashlib
import json
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, jsonify, make_response, request

from ..utils import decorators, emails
from ..utils.pmath import get_mealspace, has_mealspace

events = Blueprint("events", __name__, url_prefix="/api/events")


@events.route("/schedule", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def schedule_event(user, db):
    events = db["events"]
    name = request.get_json().get("name", None)
    if name is None:
        return {"status": "error", "msg": "missing required field: name"}, 400, {"Content-Type": "application/json"}
    event_id = secrets.token_hex(6)
    while events.find_one({"eventId": event_id}) is not None:
        event_id = secrets.token_hex(6)

    events.insert_one(
        {
            "owner": user["username"],
            "name": name,
            "eventId": event_id,
            "mustMatch": None,
            "registered": {},  # username:[party size, tableIndex]
            "meals": {},  # beef:10
            "tables": [],  # (x, y, size)
        }
    )

    return {"status": "success", "msg": "Event successfully created"}, 201, {"Content-Type": "application/json"}


@events.route("/list", methods=["GET"])
@decorators.access_database("events")
@decorators.authenticated
def get_events(user, db):
    events = db["events"]
    all_events = events.find({"owner": user["username"]})

    return jsonify([event["eventId"] for event in all_events])


@events.route("/get", methods=["GET"])
@decorators.access_database("events")
@decorators.authenticated
def get_event(user, db):
    event_id = request.get_json().get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400, {"Content-Type": "application/json"}
    event = db["events"].find_one({"eventId": event_id, "owner": user["username"]})
    if event is None:
        return (
            {"status": "error", "msg": "No such event exists, or you do not own this event"},
            404,
            {"Content-Type": "application/json"},
        )
    del event["_id"]
    return event, 200, {"Content-Type": "application/json"}


@events.route("/delete", methods=["DELETE"])
@decorators.access_database("events")
@decorators.authenticated
def delete_event(user, db):
    events = db["events"]

    event_id = request.get_json().get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400, {"Content-Type": "application/json"}

    event = events.find_one({"eventId": event_id, "owner": user["username"]})

    if event is None:
        return (
            {"status": "error", "msg": "No such event exists, or you do not own this event"},
            404,
            {"Content-Type": "application/json"},
        )

    events.delete_one({"eventId": event_id, "owner": user["username"]})

    return {"status": "success", "msg": "Event deleted"}, 200, {"Content-Type": "application/json"}


@events.route("/arrange", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def set_tables(user, db):
    events = db["events"]
    event_id = request.get_json().get("eventId", None)
    table_entries = request.get_json().get("tableEntries", None)
    if any([event_id, table_entries]) is None:
        err = []
        if event_id is None:
            err.append("eventId")
        if table_entries is None:
            err.append("tableEntries")
        return (
            {"status": "error", "msg": f"missing required field(s): {", ".join(err)}"},
            400,
            {"Content-Type": "application/json"},
        )

    event = events.find_one({"eventId": event_id, "owner": user["username"]})

    tables = []

    if event is None:
        return (
            {"status": "error", "msg": "No such event exists, or you do not own this event"},
            404,
            {"Content-Type": "application/json"},
        )

    for table in table_entries:  # [{"x":25, "y":50, "size":12}]
        tables.append((table["x"], table["y"], table["size"]))

    events.find_one_and_update({"eventId": event_id, "owner": user["username"]}, {"$set": {"tables": tables}})

    return {"status": "success", "msg": "Table map successfully created"}, 201, {"Content-Type": "application/json"}


@events.route("/update", methods=["PATCH"])
@decorators.access_database("events")
@decorators.authenticated
def update_event(user, db):
    events = db["events"]

    event_id = request.get_json().get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400, {"Content-Type": "application/json"}

    event = events.find_one({"eventId": event_id, "owner": user["username"]})

    if event is None:
        return (
            {"status": "error", "msg": "No such event exists, or you do not own this event"},
            404,
            {"Content-Type": "application/json"},
        )

    new_event = {
        "name": request.get_json().get("name", event["name"]),
        "mustMatch": request.get_json().get("mustMatch", event["mustMatch"]),
        "registered": {
            item: value
            for item, value in event["registered"].items()
            if item in request.get_json().get("registered", [])
        },
    }

    events.find_one_and_update({"eventId": event_id, "owner": user["username"]}, {"$set": new_event})

    return {"status": "success", "msg": "Event updated"}, 202, {"Content-Type": "application/json"}


@events.route("/meals/options", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def update_meals(user, db):
    events = db["events"]
    meals = request.get_json().get("meals", None)
    event_id = request.get_json().get("eventId", None)
    if any([event_id, meals]) is None:
        err = []
        if event_id is None:
            err.append("eventId")
        if meals is None:
            err.append("meals")
        return (
            {"status": "error", "msg": f"missing required field(s): {", ".join(err)}"},
            400,
            {"Content-Type": "application/json"},
        )

    event = events.find_one({"eventId": event_id, "owner": user["username"]})

    if event is None:
        return (
            {"status": "error", "msg": "No such event exists, or you do not own this event"},
            404,
            {"Content-Type": "application/json"},
        )

    events.find_one_and_update({"eventId": event_id, "owner": user["username"]}, {"$set": {"meals": meals}})

    return {"status": "success", "msg": "Event Successfully Updated"}, 201, {"Content-Type": "application/json"}


@events.route("/meals/available", methods=["GET"])
@decorators.access_database("events")
@decorators.authenticated
def available_meals(user, db):
    events = db["events"]
    event_id = request.get_json().get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400, {"Content-Type": "application/json"}
    event = events.find_one({"eventId": event_id})

    if event is None:
        return {"status": "error", "msg": "No such event exists"}, 404, {"Content-Type": "application/json"}

    if user["username"] not in event["registered"].keys():
        return (
            {"status": "error", "msg": "You are not registered for this event"},
            404,
            {"Content-Type": "application/json"},
        )

    avail_meals = {}

    for meal in event["meals"].keys():
        avail_meals[meal] = get_mealspace(event["registered"], event["meals"], meal)

    print(avail_meals)

    return jsonify(avail_meals)


@events.route("/meals/select", methods=["PATCH"])
@decorators.access_database("events")
@decorators.authenticated
def choose_meal(user, db):
    event_id = request.get_json().get("eventId", None)
    new_meals = request.get_json().get("meals", None)
    if any([new_meals, event_id]) is None:
        err = []
        if event_id is None:
            err.append("eventId")
        if new_meals is None:
            err.append("meals")
        return (
            {"status": "error", "msg": f"missing required field(s): {", ".join(err)}"},
            400,
            {"Content-Type": "application/json"},
        )

    events = db["events"]
    event = events.find_one({"eventId": event_id})

    if event is None:
        return {"status": "error", "msg": "No such event exists"}, 404, {"Content-Type": "application/json"}

    if user["username"] not in event["registered"].keys():
        return (
            {"status": "error", "msg": "You are not registered for this event"},
            404,
            {"Content-Type": "application/json"},
        )

    old_meals = event["registered"][user["username"]]["meals"]
    event["registered"][user["username"]]["meals"] = []

    meal_unavail = False
    for meal in new_meals:
        if not has_mealspace(event["registered"], event["meals"], meal):
            meal_unavail = True

    event["registered"][user["username"]]["meals"] = old_meals

    if meal_unavail:
        return (
            {"status": "error", "msg": "One or more meal options are unavailable"},
            400,
            {"Content-Type": "application/json"},
        )

    if len(new_meals) > event["registered"][user["username"]]["party"]:
        return {"status": "error", "msg": "You cannot have more meals than the size of your party"}, 400

    event["registered"][user["username"]]["meals"] = new_meals

    events.find_one_and_update({"eventId": event_id}, {"$set": event})

    return {"status": "success", "msg": "Meal successfully updated"}, 201, {"Content-Type": "application/json"}


@events.route("/register", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def register_event(user, db):
    events = db["events"]
    event_id = request.get_json().get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400, {"Content-Type": "application/json"}

    event = events.find_one({"eventId": event_id})

    if event is None:
        return {"status": "error", "msg": "No such event exists"}, 404, {"Content-Type": "application/json"}

    if event["mustMatch"] is not None:
        if not emails.is_allowed(user["email"], event["mustMatch"]):
            return {"status": "error", "msg": "Email not allowed"}, 401, {"Content-Type": "application/json"}

    event["registered"][user["username"]] = {"party": None, "table": None, "meals": []}

    events.update_one({"eventId": event_id}, {"$set": event})

    return {"status": "success", "msg": "Registered successfully"}, 200, {"Content-Type": "application/json"}


@events.route("/export_raw", methods=["GET"])
@decorators.access_database("events", "users")
@decorators.authenticated
def export_event(user, db):
    event_id = request.get_json().get("eventId", None)
    if event_id is None:
        return {"status": "error", "msg": "missing required field: eventId"}, 400, {"Content-Type": "application/json"}
    events = db["events"]
    event = events.find_one({"eventId": event_id})

    if event is None:
        return {"status": "error", "msg": "No such event exists"}, 404, {"Content-Type": "application/json"}

    if user["username"] != event["owner"]:
        return (
            {"status": "error", "msg": "You are not the owner of this event"},
            404,
            {"Content-Type": "application/json"},
        )

    users = db["users"]
    user_objs = users.find({"username": {"$in": list(event["registered"].keys())}})

    user_lut = {u["username"]: u["name"] for u in user_objs}

    csvstr = "name,table_id,party_size, ...meals\n"

    for username, props in event["registered"].items():
        buf = f"{user_lut[username]},{props['table']},{props['party']},{','.join(props['meals'])}"
        csvstr += f"{buf}\n"

    resp = make_response(csvstr)
    resp.content_type = "text/csv"
    resp.status_code = 200

    return resp


@events.route("/invite", methods=["POST"])
@decorators.access_database("events", "users")
@decorators.authenticated
def invite(user, db):
    body = request.get_json()
    invite_emails = body.get("emails", None)
    event_id = body.get("eventId", None)
    if any([emails, event_id]) is None:
        err = []
        if event_id is None:
            err.append("eventId")
        if invite_emails is None:
            err.append("emails")
        return {"status": "error", "msg": f"missing required field(s): {", ".join(err)}"}, 400
    event = db["events"].find_one({"eventId": event_id})
    if event is None:
        return {"status": "error", "msg": "No such event exists"}, 400
    if event["owner"] != user["username"]:
        return {"status": "error", "msg": "You are not the owner of this event"}, 400
    for email in invite_emails:
        msg1 = f"You've been invited by {user["name"]} to join the event {event["name"]}. Join from the user dashboard using the the event ID: {event_id}."
        msg2 = f"You've been invited by {user["name"]} to join the event {event["name"]} on Seating3. Join the event by registering and joining from the user dashboard using the the event ID: {event_id}."
        if db["users"].find_one({"email": email}) is None:
            emails.send_email("noreply@seating3.dev", email, "You've been invited to an event on Seating3!", msg2)
        else:
            emails.send_email("noreply@seating3.dev", email, "You've been invited to an event on Seating3!", msg1)
        return {"status": "success", "msg": "Successfully invited the provided emails to event"}, 200
