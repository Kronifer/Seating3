import hashlib
import secrets
from datetime import datetime
from os import environ


import pymongo
from flask import Blueprint, request
from ..utils import decorators
from ..utils.table import compute_remaining

mongouri = f"mongodb://{environ["MONGO_USR"]}:{environ["MONGO_PASS"]}@{environ["MONGO_CONTAINER_NAME"]}:{environ["MONGO_PORT"]}/?authSource=admin"
client = pymongo.MongoClient(mongouri)

placements = Blueprint("placements", __name__, url_prefix="/api/placements")

#{'eventId':'abc213', '}
@placements.on("/reserveSeat", methods=['POST'])
@decorators.authenticated
def reserve_seat(user):
    events = client.get_database("seating").get_collection("events")
    event = events.find_one({
        "eventId":request.form['eventId'],
        "registered":{"$in":[user['username']]}
    })
    if event is None:
        return "No such event exists, or you are not registered in this event", 404, {"Content-Type":"text/plain"}
    
    tableIndex = int(request.form['tableIndex'])
    partySize = int(request.form['partySize'])
    if tableIndex<0 or tableIndex > len(event['tableMap'])-1:
        return "No such table exists", 400, {"Content-Type":"text/plain"}
    
    if compute_remaining(event['placements'], event['tableMap'], tableIndex) < partySize:
        return "Not enough space", 401, {"Content-Type":"text/plain"}

    event['placements'][user['username']] = [partySize, tableIndex]
    
    

