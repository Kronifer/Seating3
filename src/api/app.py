from flask import Flask

from .routes.events import events
from .routes.seats import seats
from .routes.users import users

app = Flask(__name__)

app.register_blueprint(users)
app.register_blueprint(events)
app.register_blueprint(seats)
