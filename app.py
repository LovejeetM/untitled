from flask import Flask, render_template, request, url_for, redirect
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import length, input_required, ValidationError
from flask_bcrypt import Bcrypt

from flask_socketio import SocketIO

#-----------------------------------------------------------------------------------------------------------
import google.generativeai as genai
import wave
# import re
# import random
import subprocess
import os
import threading
from collections import deque
from dotenv import load_dotenv

load_dotenv()
key = os.environ.get('API_KEY')
db_key = os.environ.get('DB_KEY')
#-----------------------------------------------------------------------------------------------------------

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = db_key
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, cors_allowed_origins="*")




login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key= True)
    username = db.Column(db.String(30), nullable = False, unique= True)
    password = db.Column(db.String(100), nullable = False)

class RegisterForm(FlaskForm):
    username = StringField(validators= [input_required(), length( min=4, max=30)], render_kw= {"placeholder": "Username"})
    password = PasswordField(validators= [input_required(), length( min=4, max=20)], render_kw= {"placeholder": "Password"})
    submit = SubmitField("Register")

    def validate_username(self, username):
        existing_user_username = User.query.filter_by(username= username.data).first()
        if existing_user_username:
            raise ValidationError("Username Already exists, enter another one")
        
class LoginForm(FlaskForm):
    username = StringField(validators= [input_required(), length( min=4, max=30)], render_kw= {"placeholder": "Username"})
    password = PasswordField(validators= [input_required(), length( min=4, max=20)], render_kw= {"placeholder": "Password"})
    submit = SubmitField("Login")


# user data for testing
#-----------------------------------------------------------------------------------------------------------
with app.app_context():
    db.create_all()
    existing_user = User.query.filter_by(username='test').first()
    if not existing_user:
        hased_pw = bcrypt.generate_password_hash('1234')
        user1 = User(username='test', password=hased_pw)
        db.session.add(user1)
        db.session.commit()
#-----------------------------------------------------------------------------------------------------------


@app.route('/')
def home():
    return render_template('loginpage.html')

@app.route('/register', methods= ['GET', 'POST'])
def register():
    form = RegisterForm()
    
    if form.validate_on_submit():
        hased_pwd = bcrypt.generate_password_hash(form.password.data)
        new_user = User(username= form.username.data, password= hased_pwd)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))

    return render_template('reg.html', form= form)

@app.route('/login', methods= ['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username= form.username.data).first()
        if user:
            if bcrypt.check_password_hash(user.password, form.password.data):
                login_user(user)
                return redirect(url_for('dashboard'))
    return render_template('logn.html', form= form)

@app.route('/logout', methods= ['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard', methods= ['GET', 'POST'])
def dashboard():
    return render_template('demo3.html')

def send_file_url(file_url):
    socketio.emit("file_url", {"url": file_url})

@app.route("/trigger", methods=['POST'])
def trigger():
    file_url = "/static/testing.wav"
    send_file_url(file_url)
    return '', 204

@app.route("/trigger2", methods=['POST'])
def trigger2():
    file_url = "/static/39.wav"
    send_file_url(file_url)
    return '', 204

@app.route('/process_speech', methods=['POST'])
def process_query():
    data = request.get_json()
    # generate_(data)
    return '', 204

# def synthesize_speech2(text, model_filename='en_US-hfc_female-medium.onnx', output_path='static/test.wav'):
#     piper_executable = os.path.join(os.getcwd(), 'piper', 'piper.exe')
#     model_path = os.path.join(os.getcwd(), 'piper', model_filename)
#     command = f'"{piper_executable}" -m "{model_path}" --length-scale 1.0 -f "{output_path}"'
    
#     subprocess.run(command, input=text.encode(), shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#     print(f"Generated {output_path}.")
#     path1= f"/{output_path}"
#     send_file_url(path1)





if __name__ == '__main__':
    app.run(debug= True, port='5000')