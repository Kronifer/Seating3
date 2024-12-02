from flask import Flask

from .routes.users import users
from .routes.events import events
from .routes.placements import placements

app = Flask(__name__)

app.register_blueprint(users)
app.register_blueprint(events)
app.register_blueprint(placements)