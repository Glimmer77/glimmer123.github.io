from flask import Flask, request, jsonify, render_template, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from mangum import Mangum

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'  # 数据库文件路径
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key'  # 用于会话管理
db = SQLAlchemy(app)
CORS(app)

# 创建 Mangum 处理器，使 Flask 应用适配 AWS Lambda
handler = Mangum(app)

# 玩家模型
class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)

# 得分模型
class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    game_date = db.Column(db.DateTime, default=datetime.utcnow)

# 初始化数据库
with app.app_context():
    db.create_all()

# 首页（展示登录/注册页面）
@app.route('/')
def home():
    return render_template('index.html')

# 玩家注册（POST）
@app.route('/players', methods=['POST'])
def add_player():
    data = request.get_json()
    username = data['username']
    existing_player = Player.query.filter_by(username=username).first()
    if existing_player:
        return jsonify({'message': 'Username already exists'}), 400
    new_player = Player(username=username)
    db.session.add(new_player)
    db.session.commit()
    return jsonify({'message': 'Player created', 'player_id': new_player.id}), 201

# 玩家登录（POST）
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    player = Player.query.filter_by(username=username).first()
    if player:
        # 保存玩家到session
        session['username'] = username
        return jsonify({'message': f'欢迎 {username} 登录！'}), 200
    else:
        return jsonify({'message': '玩家不存在'}), 404

# 玩家登出（POST）
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'message': '成功登出'}), 200

# 添加玩家得分（POST）
@app.route('/players/<int:player_id>/scores', methods=['POST'])
def add_score(player_id):
    data = request.get_json()
    score = data['score']
    new_score = Score(player_id=player_id, score=score)
    db.session.add(new_score)
    db.session.commit()
    return jsonify({'message': '得分已添加', 'score': score, 'player_id': player_id}), 201

# 获取当前登录玩家的得分记录（GET）
@app.route('/current_scores', methods=['GET'])
def current_scores():
    username = session.get('username')
    if username:
        player = Player.query.filter_by(username=username).first()
        scores = Score.query.filter_by(player_id=player.id).all()
        return jsonify({
            'username': username,
            'scores': [{'score': score.score, 'game_date': score.game_date.isoformat()} for score in scores]
        })
    else:
        return jsonify({'message': '请先登录'}), 401

if __name__ == '__main__':
    app.run(debug=True)
