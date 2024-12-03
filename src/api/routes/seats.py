import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request, jsonify
from ..utils import decorators
from ..utils.table import compute_remaining

seats = Blueprint("seats", __name__, url_prefix="/api/seats")

#{'eventId':'abc213', '}
@seats.route("/reserveSeat", methods=['POST'])
@decorators.access_database("events")
@decorators.authenticated 
def reserve_seat(user, db): #{eventId, tableIndex, partySize}
    events = db['events']
    event = events.find_one({
        "eventId":request.form['eventId'],
        "registered":{"$in":[user['username']]}
    })
    if event is None:
        return "No such event exists, or you are not registered for this event", 404, {"Content-Type":"text/plain"}
    
    tableIndex = int(request.form['tableIndex'])
    partySize = int(request.form['partySize'])
    if tableIndex<0 or tableIndex > len(event['tableMap'])-1:
        return "No such table exists", 400, {"Content-Type":"text/plain"}
    
    if compute_remaining(event['placements'], event['tableMap'], tableIndex) < partySize:
        return "Not enough space", 409, {"Content-Type":"text/plain"}

    event['placements'][user['username']] = [partySize, tableIndex]
    return "Seat Reserved", 201, {"Content-Type":"text/plain"}

@seats.route("/getState", methods=['POST']) #post because we will probably have some easy api set up
@decorators.access_database("events")
@decorators.authenticated
def get_state(user, db):
    events = db['events']
    event = events.find_one({
        "eventId":request.form['eventId'],
        "registered":{"$in":[user['username']]}
    })
    if event is None:
        return "No such event exists, or you are not registered for this event", 404, {"Content-Type":"text/plain"}
    
    modMap = {
        (a[0], a[1]):compute_remaining(event['placements'], event['tableMap'], i) for i, a in enumerate(event['tableMap'])
    }

    return jsonify(modMap)

