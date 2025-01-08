import hashlib
import secrets
from datetime import datetime
from os import environ

import pymongo
from flask import Blueprint, request, jsonify
from ..utils import decorators
from ..utils.pmath import compute_remaining

seats = Blueprint("seats", __name__, url_prefix="/api/seats")

#{'eventId':'abc213', '}
@seats.route("/reserve", methods=['POST'])
@decorators.access_database("events")
@decorators.authenticated 
def reserve_seat(user, db): #{eventId, tableIndex, partySize}
    events = db['events']
    event = events.find_one({
        "eventId":request.get_json()['eventId'],
    })

    if event is None:
        return  {"status":"error", "msg":"No such event exists"}, 404, {"Content-Type":"text/plain"}
    
    if(user['username'] in event['regsitered'].keys()):
        return  {"status":"error", "msg":"You are not registered for this event"}, 404, {"Content-Type":"text/plain"}
    
    tableIndex = int(request.get_json()['tableIndex'])
    partySize = int(request.get_json()['partySize'])
    if tableIndex<0 or tableIndex > len(event['tables'])-1:
        return  {"status":"error", "msg":"No such table exists"}, 400, {"Content-Type":"text/plain"}
    
    if compute_remaining(event['registered'], event['tables'], tableIndex) < partySize:
        return  {"status":"error", "msg":"Not enough space"}, 409, {"Content-Type":"text/plain"}

    event['registered'][user['username']]['party'] = partySize
    event['registered'][user['username']]['table'] = tableIndex

    events.update_one({
        "eventId":request.get_json()['eventId'],
    }, {"$set":{"registered":event['registered']}})

    return  {"status":"success", "msg":"Seat Reserved"}, 201, {"Content-Type":"text/plain"}

@seats.route("/state", methods=['GET'])
@decorators.access_database("events")
@decorators.authenticated
def get_state(user, db):
    events = db['events']
    event = events.find_one({
        "eventId":request.get_json()['eventId']
    })

    if event is None:
        return  {"status":"error", "msg":"No such event exists, or you are not registered for this event"}, 404, {"Content-Type":"text/plain"}
    
    if(user['username'] in event['regsitered'].keys()):
        return  {"status":"error", "msg":"You are not registered for this event"}, 404, {"Content-Type":"text/plain"}
    

    modMap = [
        (a[0], a[1], compute_remaining(event['registered'], event['tables'], i)) for i, a in enumerate(event['tables'])
    ]

    return jsonify(modMap)

