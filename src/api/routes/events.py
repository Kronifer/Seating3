import hashlib
import secrets
from datetime import datetime
from os import environ


import json
import pymongo
from flask import Blueprint, request, jsonify
from ..utils import decorators
from ..utils import emails
from ..utils.pmath import has_mealspace, get_mealspace

events = Blueprint("events", __name__, url_prefix="/api/events")

@events.route("/schedule", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def schedule_event(user, db):
    events = db['events']
    name = request.get_json()['name']
    event_id = secrets.token_hex(6)
    while events.find_one({"eventId":event_id}) is not None:
        event_id = secrets.token_hex(6)

    events.insert_one({
        "owner": user['username'], 
        "name":name,
        "eventId":event_id,
        "mustMatch":None,
        "registered":{}, #username:[party size, tableIndex]
        "meals":{"diddy meal":1},#beef:10
        "tables":[] #(x, y, size)
    })

    return "Event successfully created", 201, {"Content-Type":"text/plain"}

@events.route("/list", methods=["GET"])
@decorators.access_database("events")
@decorators.authenticated
def get_events(user, db):
    events = db['events']
    all_events =  events.find({
        "owner":user['username']
    })

    return jsonify([event['eventId'] for event in all_events])

@events.route("/delete", methods=["DELETE"])
@decorators.access_database("events")
@decorators.authenticated
def delete_event(user, db):
    events = db['events']

    event_id = request.get_json()['eventId']
    
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
        "eventId":request.get_json()['eventId'],
        "owner":user['username']
    })
    
    tables = []

    if event is None:
        return "No such event exists, or you do not own this event", 404, {"Content-Type":"text/plain"}
    

    for table in json.loads(request.get_json()['tableEntries']): #[{"x":25, "y":50, "size":12}]
        tables.append((table['x'], table['y'], table['size']))

    events.find_one_and_update({
        "eventId":request.get_json()['eventId'],
        "owner":user['username']
    }, {"$set": {"tables":tables}})

    return "Table map successfully created", 201, {"Content-Type":"text/plain"}




@events.route("/update", methods=["PATCH"])
@decorators.access_database("events")
@decorators.authenticated
def update_event(user, db):
    events = db['events']

    event_id = request.get_json()['eventId']
    
    event = events.find_one({
        "eventId":event_id,
        "owner":user['username']
    })

    if event is None:
        return "No such event exists, or you do not own this event", 404, {"Content-Type":"text/plain"}


    new_event = {
        'name':request.get_json().get('name', event['name']),
        'mustMatch':request.get_json().get('mustMatch', event['mustMatch']),
        'registered':{item:value for item,value in event['registered'].items() if item in request.get_json().get('registered', [])}
    }

    events.find_one_and_update({
        "eventId":event_id,
        "owner":user['username']
    }, {"$set": new_event})


    return "Event updated", 202, {"Content-Type":"text/plain"}

@events.route("/meals/options", methods=['POST'])
@decorators.access_database("events")
@decorators.authenticated
def update_meals(user, db):
    events = db['events']
    meals = request.get_json()['meals']

    event = events.find_one({
        "eventId":request.get_json()['eventId'],
        "owner":user['username']
    })

    if event is None:
        return "No such event exists, or you do not own this event", 404, {"Content-Type":"text/plain"}


    events.find_one_and_update({
        "eventId":request.get_json()['eventId'],
        "owner":user['username']
    }, {"$set":{"meals":({"diddy meal":1} | json.loads(meals))}})

    return "Event Successfully Updated", 201, {"Content-Type":"text/plain"}



@events.route("/meals/available", methods=["GET"])
@decorators.access_database("events")
@decorators.authenticated
def available_meals(user, db):
    events = db['events']
    event = events.find_one({
        "eventId":request.get_json()['eventId']
    })

    if event is None:
        return "No such event exists", 404, {"Content-Type":"text/plain"}


    if user['username'] not in event['registered'].keys():
        return "You are not registered for this event", 404, {"Content-Type":"text/plain"}
        
    avail_meals = {}


    for meal in event['meals'].keys():
        if meal == "diddy meal":
            continue
        avail_meals[meal] = get_mealspace(event['registered'], event['meals'], meal)
    
    print(avail_meals)

    return jsonify(avail_meals)


@events.route("/meals/select", methods=["PATCH"])
@decorators.access_database("events")
@decorators.authenticated
def choose_meal(user, db):

    events = db['events']
    event = events.find_one({
        "eventId":request.get_json()['eventId']
    })

    new_meals = json.loads(request.get_json()['meals'])


    if event is None:
        return "No such event exists", 404, {"Content-Type":"text/plain"}


    if user['username'] not in event['registered'].keys():
        return "You are not registered for this event", 404, {"Content-Type":"text/plain"}
    
    old_meals = event['registered'][user['username']]['meals']
    event['registered'][user['username']]['meals'] = []

    meal_unavail = False
    for meal in new_meals:
        if not has_mealspace(event['registered'], event['meals'], meal):
            meal_unavail = True
    

    event['registered'][user['username']]['meals'] = old_meals

    if meal_unavail:
        return "One or more meal options are unavailable", 400, {"Content-Type":"text/plain"}
        
    
    event['registered'][user['username']]['meals'] = new_meals

    events.find_one_and_update({
        "eventId":request.get_json()['eventId']
    }, {"$set":event})


    return "Meal successfully updated", 201, {"Content-Type":"text/plain"}


@events.route("/register", methods=["POST"])
@decorators.access_database("events")
@decorators.authenticated
def register_event(user, db):
    events = db['events']
    event_id = request.get_json()['eventId']

    event = events.find_one({
        "eventId":event_id
    })

    if event is None:
        return "No such event exists", 404, {"Content-Type":"text/plain"}

    if event['mustMatch'] is not None:
        if not emails.is_allowed(user['email'], event['mustMatch']):
            return "Email not allowed", 401, {"Content-Type":"text/plain"}
        
    
    event['registered'][user['username']] = {"party":None, "table":None, "meals":[]}

    events.update_one({
        "eventId":event_id
    }, {"$set":event})

    return "Registered successfully", 200, {"Content-Type":"text/plain"}



@events.route("/export", methods=['GET'])
@decorators.access_database("events")
@decorators.authenticated
def export_event(user, db):
    events = db['events']
    event = events.find_one({
        "eventId":request.get_json()['eventId']
    })

    new_meals = json.loads(request.get_json()['meals'])


    if event is None:
        return "No such event exists", 404, {"Content-Type":"text/plain"}


    if user['username'] != event['owner']:
        return "You are not the owner of this event", 404, {"Content-Type":"text/plain"}