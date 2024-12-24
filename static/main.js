// 创建游戏实例
var game = new Phaser.Game(480, 300, Phaser.CANVAS, null, {
    preload: preload,
    create: create,
    update: update
});

// 变量声明
var ball;
var paddle;
var bricks;
var brickInfo;
var scoreText;
var score = 0;
var lives = 3;
var livesText;
var lifeLostText;
var playing = false;
var startButton;
var currentPlayerId;


function preload() {
    // 设置游戏缩放模式
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.stage.backgroundColor = '#eee';

    // 加载资源
    game.load.image('ball', '/static/images/ball.png');  // 普通图片
    game.load.image('paddle', '/static/images/paddle.png');
    game.load.image('brick', '/static/images/brick.png');
    game.load.spritesheet('wobbleBall', '/static/images/wobble.png', 20, 20); // spritesheet 图片
    game.load.spritesheet('button', '/static/images/button.png', 120, 40);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    ball = game.add.sprite(game.world.width*0.5, game.world.height-25, 'ball');
    ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);
    ball.anchor.set(0.5);
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);

    paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');
    paddle.anchor.set(0.5,1);
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.body.immovable = true;

    game.physics.arcade.checkCollision.down = false;
    ball.checkWorldBounds = true;
    ball.events.onOutOfBounds.add(ballLeaveScreen, this);

    initBricks();

    var textStyle = { font: '18px Arial', fill: '#0095DD' };
    scoreText = game.add.text(5, 5, 'Points: 0', textStyle);
    livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle);
    livesText.anchor.set(1,0);
    lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, '失误了，鼠标点击继续', textStyle);
    lifeLostText.anchor.set(0.5);
    lifeLostText.visible = false;

    startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2);
    startButton.anchor.set(0.5);
}

function update() {
    game.physics.arcade.collide(ball, paddle, ballHitPaddle);
    game.physics.arcade.collide(ball, bricks, ballHitBrick);

    if(playing) {
        paddle.x = game.input.x || game.world.width*0.5;
    }
}

function initBricks() {
    brickInfo = {
        width: 50,
        height: 20,
        count: {
            row: 7,
            col: 3
        },
        offset: {
            top: 50,
            left: 60
        },
        padding: 10
    };
    bricks = game.add.group();
    for(var c=0; c<brickInfo.count.col; c++) {
        for(var r=0; r<brickInfo.count.row; r++) {
            var brickX = (r*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left;
            var brickY = (c*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top;
            newBrick = game.add.sprite(brickX, brickY, 'brick');
            game.physics.enable(newBrick, Phaser.Physics.ARCADE);
            newBrick.body.immovable = true;
            newBrick.anchor.set(0.5);
            bricks.add(newBrick);
        }
    }
}

function ballHitBrick(ball, brick) {
    var killTween = game.add.tween(brick.scale);
    killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None);
    killTween.onComplete.addOnce(function(){
        brick.kill();
    }, this);
    killTween.start();

    score += 10;
    scoreText.setText('Points: '+score);

    var count_alive = 0;
    for (var i = 0; i < bricks.children.length; i++) {
      if (bricks.children[i].alive == true) {
        count_alive++;
      }
    }
    if (count_alive == 0) {
      alert('恭喜你获胜了');
      location.reload();
    }
}

function ballLeaveScreen() {
    lives--;
    if(lives) {
        livesText.setText('Lives: '+lives);
        lifeLostText.visible = true;
        ball.reset(game.world.width*0.5, game.world.height-25);
        paddle.reset(game.world.width*0.5, game.world.height-5);
        game.input.onDown.addOnce(function(){
            lifeLostText.visible = false;
            ball.body.velocity.set(150, -150);
        }, this);
    }
    else {
        alert('你输了，游戏结束');
        // location.reload(); // 移除这行代码
        endGame(); // 调用结束游戏的函数
    }
}

function endGame() {
    alert('你输了，游戏结束');
    submitScore(score, currentPlayerId); 
    resetGame(); // 调用重置游戏状态的函数
}

function resetGame() {
    // 重置游戏状态
    score = 0;
    lives = 3;
    scoreText.setText('Points: 0');
    livesText.setText('Lives: '+lives);
    lifeLostText.visible = false;
    ball.kill();
    paddle.kill();
    bricks.removeAll(true, true);
    initBricks(); // 重新初始化砖块
    ball = game.add.sprite(50, 250, 'ball');
    ball.animations.add('wobble', [0,1,0,2,0,1,0,2,0], 24);
    ball.anchor.set(0.5);
    game.physics.enable(ball, Phaser.Physics.ARCADE);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.set(1);
    paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');
    paddle.anchor.set(0.5,1);
    game.physics.enable(paddle, Phaser.Physics.ARCADE);
    paddle.body.immovable = true;
    playing = false;
    startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2);
    startButton.anchor.set(0.5);
}

function ballHitPaddle(ball, paddle) {
    ball.animations.play('wobble');
    ball.body.velocity.x = -1*5*(paddle.x-ball.x);
}

function startGame() {
    startButton.destroy();
    ball.body.velocity.set(150, -150);
    playing = true;
}

function createPlayer(username) {
    if (!username) {
        alert('Please enter a valid username');
        return;
    }
}


function createPlayer(username) {
    fetch('http://localhost:5000/players', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('用户已存在');
        }
        return response.json();
    })
    .then(data => {
        console.log('Player created:', data);
        currentPlayerId = data.player_id;
        alert(`Player ${username} created successfully.`);
        fetchPlayerData(currentPlayerId);
        fetchScores(currentPlayerId);
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
}

function loginPlayer(username) {
    fetch(`http://localhost:5000/players?username=${username}`, {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch player data');
        }
        return response.json();
    })
    .then(data => {
        const players = Array.isArray(data) ? data : [data];
        const player = players.find(p => p.username === username);

        if (player) {
            currentPlayerId = player.id;
            alert(`欢迎回来, ${username}!`);
            fetchPlayerData(currentPlayerId);
            fetchScores(currentPlayerId);
        } else {
            // 如果没有找到玩家，则自动创建该玩家
            alert('Player not found. Creating a new account...');
            createPlayer(username);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
}

function submitScore(score, playerId) {
    fetch(`http://localhost:5000/players/${playerId}/scores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: score, game_date: new Date().toISOString() })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit score');
        }
        return response.json();
    })
    .then(data => {
        console.log('Score submitted:', data);
        alert(`Score ${score} submitted successfully.`);
        // 提交得分成功后，重新获取并显示最新的得分记录
        fetchScores(playerId);
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
}

function fetchPlayerData(playerId) {
    fetch(`http://localhost:5000/players/${playerId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch player data');
            }
            return response.json();
        })
        .then(data => {
            console.log('Player data:', data);
            document.getElementById('playerInfo').textContent = `Username: ${data.username}`;
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}

function fetchScores(playerId) {
    fetch(`http://localhost:5000/players/${playerId}/scores`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch scores');
            }
            return response.json();
        })
        .then(data => {
            console.log('Scores data:', data);
            const scoresContainer = document.getElementById('scoresHistory');
            scoresContainer.innerHTML = ''; // Clear previous scores
            if (Array.isArray(data) && data.length === 0) {
                scoresContainer.textContent = 'No scores available.';
            } else {
                data.forEach(score => {
                    const scoreElement = document.createElement('div');
                    scoreElement.textContent = `Score: ${score.score}, Date: ${new Date(score.game_date).toLocaleString()}`;
                    scoresContainer.appendChild(scoreElement);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}

// 监听按钮事件
document.getElementById('createButton').addEventListener('click', function() {
    const username = document.getElementById('usernameInput').value;
    if (username) {
        createPlayer(username);
    } else {
        alert('Please enter a valid username.');
    }
});

document.getElementById('loginButton').addEventListener('click', function() {
    const username = document.getElementById('usernameInput').value;
    if (username) {
        loginPlayer(username);
    } else {
        alert('Please enter a valid username.');
    }
});
