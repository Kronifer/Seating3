import hashlib
import secrets
from datetime import datetime
from os import environ


import json
import pymongo
from flask import Blueprint, request
from ..utils import decorators
from ..utils import emails

events = Blueprint("events", __name__, url_prefix="/api/events")

@events.route("/schedule", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def schedule_event(user, db):
    events = db['events']
    name = request.form['name']
    event_id = secrets.token_hex(6)
    while events.find_one({"eventId":event_id}) is not None:
        event_id = secrets.token_hex(6)

    events.insert_one({
        "owner": user['username'], 
        "name":name,
        "eventId":event_id,
        "mustMatch":None,
        "placements":{}, #username:[party size, tableIndex]
        "tableMap":[], #(x, y, size)
        "registered":[]
    })

    return "Event successfully created", 201, {"Content-Type":"text/plain"}


@events.route("/delete", methods=["DELETE"])
@decorators.access_database("events")
@decorators.authenticated
def delete_event(user, db):
    events = db['events']

    event_id = request.form['eventId']
    
    event = events.find_one({
        "eventId":event_id,
        "owner":user['username']
    })

    if event is None:
        return "No such event exists, or you do not own this event", 404, {"Content-Type":"text/plain"}

    events.delete_one({
        "eventId":event_id,
        "owner":user['username']
    })

    return "Event deleted", 200, {"Content-Type":"text/plain"}

@events.route("/arrange", methods=['POST'])
@decorators.access_database("events")
@decorators.authenticated
def set_tables(user, db):
    events = db['events']

    event = events.find_one({
        "eventId":request.form['eventId'],
        "owner":user['username']
    })
    
    tables = []

    if event is None:
        return "No such event exists, or you do not own this event", 404, {"Content-Type":"text/plain"}

    for table in json.loads(request.form['tableEntries']): #[{"x":25, "y":50, "size":12}]
        tables.append((table['x'], table['y'], table['size']))

    events.find_one_and_update({
        "eventId":request.form['eventId'],
        "owner":user['username']
    }, {"$set": {"tableMap":tables}})

    return "Table map successfully created", 201, {"Content-Type":"text/plain"}




@events.route("/update", methods=["PATCH"])
@decorators.access_database("events")
@decorators.authenticated
def update_event(user, db):
    events = db['events']

    event_id = request.form['eventId']
    
    event = events.find_one({
        "eventId":event_id,
        "owner":user['username']
    })

    if event is None:
        return "No such event exists, or you do not own this event", 404, {"Content-Type":"text/plain"}


    new_event = {
        'name':request.form.get('name', event['name']),
        'mustMatch':request.form.get('mustMatch', event['mustMatch']),
        'registered':[item for item in event['registered'] if item in request.form.get('registered', [])]
    }

    events.find_one_and_update({
        "eventId":event_id,
        "owner":user['username']
    }, {"$set": new_event})


    return "Event updated", 202, {"Content-Type":"text/plain"}


@events.route("/register", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def register_event(user, db):
    events = db['events']
    event_id = request.form['eventId']

    event = events.find_one({
        "eventId":event_id
    })

    if event is None:
        return "No such event exists", 404, {"Content-Type":"text/plain"}

    if event['mustMatch'] is not None:
        if not emails.is_allowed(user['email'], event['mustMatch']):
            return "Email not allowed", 401, {"Content-Type":"text/plain"}
        

    event['registered'].append(user['username'])

    events.update_one({
        "eventId":event_id
    }, {"$set":event})

    return "Registered successfully", 200, {"Content-Type":"text/plain"}

