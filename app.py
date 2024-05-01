from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, create_refresh_token, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

app = Flask(__name__)
app.config["JWT_COOKIE_SECURE"] = False
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['JWT_SECRET_KEY'] = 'sGhmjitq'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=30)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
db = SQLAlchemy(app)
jwt = JWTManager(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)

# Note model
class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    text = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(100), nullable=False)

@app.before_request
def create_tables():
    db.create_all()  # Create database tables before the first request

# Route to handle user registration
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(nickname=data['nickname']).first():
        return jsonify({'message': 'User already exists'}), 409
    hashed_password = generate_password_hash(data['password'])
    new_user = User(nickname=data['nickname'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

# Route to handle user login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(nickname=data['nickname']).first()
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=data['nickname'])
        refresh_token = create_refresh_token(identity=data['nickname'])
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200
    return jsonify({'message': 'Invalid username or password'}), 401

# Route to add a new note
@app.route('/add_note', methods=['POST'])
def add_note():
    data = request.get_json()
    if not data or 'title' not in data or 'text' not in data or 'author' not in data or 'date' not in data:
        return jsonify({'status': 'error', 'message': 'Missing title, text, author, or date'}), 400
    new_note = Note(title=data['title'], text=data['text'], author=data['author'], date=data['date'])
    db.session.add(new_note)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Note saved'})

# Route to retrieve all notes
@app.route('/get_notes')
def get_notes():
    notes = Note.query.all()
    return jsonify([{'title': note.title, 'text': note.text, 'author': note.author, 'date': note.date, 'id': note.id} for note in notes])

# Route to delete a note
@app.route('/delete_note/<int:note_id>', methods=['POST'])
@jwt_required()
def delete_note(note_id):
    note = Note.query.filter_by(id=note_id).first()
    if note:
        db.session.delete(note)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Note deleted'})
    else:
        return jsonify({'status': 'error', 'message': 'Note not found'}), 404


# Route to update a note
@app.route('/update_note/<int:id>', methods=['POST'])
@jwt_required()
def update_note(id):
    data = request.get_json()
    note = Note.query.get_or_404(id)
    note.title = data.get('title', note.title)
    note.text = data.get('text', note.text)
    note.date = data.get('date', note.date)  # Ensure the date can be updated
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Note updated'})

# Refresh token
@app.route('/token/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify({'access_token': new_token})

@app.route('/signupPage')
def signupPage():
    return render_template('signup.html')

@app.route('/loginPage')
def loginPage():
    return render_template('login.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

if __name__ == '__main__':
    app.run(debug=True)
