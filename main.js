// Get the 2D context from the canvas in our HTML page.
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

// Event handlers.
window.addEventListener('keydown', function(evt) { onKeyDown(evt);}, false);
window.addEventListener('keyup', function(evt) { onKeyUp(evt);}, false);

// Delta time.
var startFrameMillis = Date.now();
var endFrameMillis = Date.now();
var currentDeltaTime = 0;

function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();
	var currentDeltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	if (currentDeltaTime > 1)
	{
		currentDeltaTime = 1;
	}
	
	//console.log(startFrameMillis - endFrameMillis);
	return currentDeltaTime;
}

// Constants.
var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;
var ASTEROID_SPEED = 0.8;
var PLAYER_SPEED = 1;
var PLAYER_TURN_SPEED = 0.06;
var BULLET_SPEED = 1.5;
// Game States.
var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_GAMEOVER = 2;
var gameState = STATE_SPLASH;

// Variables.
var gameScore = 0;
var gameHighScore = 0;
var debug = false;

// Load image to use for tiled background.
var grass = document.createElement("img");
grass.src = "grass.png";
var background = [];
for(var y=0; y<15; y++)
{
	background[y] = [];
	for(var x=0; x<20; x++)
	{
		background[y][x] = grass;
	}
}

// Player object and assign properties.
var player = {
	image: document.createElement("img"),
	x: SCREEN_WIDTH/2,
	y: SCREEN_HEIGHT/2,
	width: 60,
	height: 60,
	directionX: 0,
	directionY: 0,
	angularDirection: 0,
	rotation: 0,
	isDead: false
};

// Set the image for the plater to userAgent.
player.image.src = "ship.png";

// Array to store asteroids.
var asteroids = [];

// Array to store asteroids.
var stars = [];

// Return a random number between to variables.
function rand(floor, ceil)
{
	return Math.floor((Math.random()*(ceil-floor))+floor);
}

// Add new asteroid.
function spawnAsteroid()
{
	// Create new asteroid.
	asteroid = {};
	asteroid.image = document.createElement("img");

	// Sizes: small, medium, large.
	asteroid.size = rand(0,4);
	if (asteroid.size == 0)
	{
		asteroid.image.src = "rock_small.png";
		asteroid.width = 22;
		asteroid.height = 20;
	}
	else if (asteroid.size == 1)
	{
		asteroid.image.src = "rock_medium.png";
		asteroid.width = 40;
		asteroid.height = 50;
	}
	else
	{
		asteroid.image.src = "rock_large.png";
		asteroid.width = 69;
		asteroid.height = 75;
	}

	// Move in a random direction.
	var x = SCREEN_WIDTH/2;
	var y = SCREEN_HEIGHT/2;

	var dirX = rand(-10,10);
	var dirY = rand(-10,10);

	// Normalise direction.
	var magnitude = (dirX * dirX) + (dirY * dirY);
	if(magnitude !=0)
	{
		var oneOverMag = 1/ Math.sqrt(magnitude);
		dirX *= oneOverMag;
		dirY *= oneOverMag;
	}
	// Multiply by screen width to move that amount from the centre of screen.
	var movX = dirX * SCREEN_WIDTH;
	var movY = dirY * SCREEN_HEIGHT;

	// Add direction to the original position to get the starting position of the asteroid.
	asteroid.x = x + movX;
	asteroid.y = y + movY;

	// Reverse the direction we found earlier.
	asteroid.velocityX = -dirX * ASTEROID_SPEED;
	asteroid.velocityY = -dirY * ASTEROID_SPEED;

	// Add new asteroid to the end of the asteroids array.
	asteroids.push(asteroid);
}

// Create all the bullets in the game.
var bullets = [];

// Handle player pressing space to shoot.
function playerShoot()
{
	var bullet = {
		image: document.createElement("img"),
		x: player.x,
		y: player.y,
		width: 5,
		height: 5,
		velocityX: 0,
		velocityY: 0
	};

	bullet.image.src = "bullet.png";

	// Velocity that shoots bullet update.
	var velX = 0;
	var velY = -1;

	// Now rotate vector according to ships current direction.
	var s = Math.sin(player.rotation);
	var c = Math.cos(player.rotation);

	// Rotation matrix.
	var xVel = (velX * c) - (velY * s);
	var yVel = (velX * s) + (velY * c);

	// Just store the pre-calc velocity.
	bullet.velocityX = xVel * BULLET_SPEED * 300 * currentDeltaTime;
	bullet.velocityY = yVel * BULLET_SPEED * 300 * currentDeltaTime;

	// Add bullet to the bullets array.
	bullets.push(bullet);

	// Check if you are the Larger Plane.
	if (planeNumber == 2)
	{
		extraBullets(-0.2, -1);
		extraBullets(0.2, -1);
	}
}

// Extra bullet fired from Plane at a different speed.
function extraBullets(velX, velY, multi)
{
	var extraBullet = {
		image: document.createElement("img"),
		x: player.x,
		y: player.y,
		width: 5,
		height: 5,
		velocityX: 0,
		velocityY: 0
	};

	extraBullet.image.src = "bullet.png";

	// Now rotate vector according to ships current direction.
	var s = Math.sin(player.rotation);
	var c = Math.cos(player.rotation);

	// Rotation matrix.
	var xVel = (velX * c) - (velY * s);
	var yVel = (velX * s) + (velY * c);

	extraBullet.velocityX = xVel * BULLET_SPEED * 300 * currentDeltaTime;
	extraBullet.velocityY = yVel * BULLET_SPEED * 300 * currentDeltaTime;

	bullets.push(extraBullet);    
}

// Key constants.
var KEY_SPACE = 32;
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_UP = 40;
var KEY_DOWN = 38;
var KEY_A = 65;
var KEY_S = 83;
var KEY_D = 68;

// Timer for shooting.
var shootTimer = 0;

// Timer for spawner.
var spawnTimer = 0;

// Keep firing variable.
var shoot = false

// Handle key down events.
function onKeyDown(event)
{
	// Game Controls
	if (gameState == STATE_GAME)
	{
		if(event.keyCode == KEY_UP)
		{
			player.directionY = 3 * 100 * currentDeltaTime;
		}
		if(event.keyCode == KEY_DOWN)
		{
			player.directionY = -3  * 100 * currentDeltaTime;
		}
		if(event.keyCode == KEY_LEFT)
		{
			player.angularDirection = -1  * 100 * currentDeltaTime;
		}
		if(event.keyCode == KEY_RIGHT)
		{
			player.angularDirection = 1  * 100 * currentDeltaTime;
		}
		if(event.keyCode == KEY_A)
		{
			player.directionX = -3 * 100 * currentDeltaTime;
		}
		if(event.keyCode == KEY_S)
		{
			player.directionX = 3 * 100 * currentDeltaTime;
		}
		if(event.keyCode == KEY_SPACE && shootTimer <= 0)
		{
			shoot = true; // keep firing var.
			shootTimer += 0.3;
			playerShoot();
		}
	}
}

// Handle key up events.
function onKeyUp(event)
{
	// Game Controls
	if (gameState == STATE_GAME)
	{
		if(event.keyCode == KEY_UP)
		{
			player.directionY = 0;
		}
		if(event.keyCode == KEY_DOWN)
		{
			player.directionY = 0;
		}
		if(event.keyCode == KEY_LEFT)
		{
			player.angularDirection = 0;
		}
		if(event.keyCode == KEY_RIGHT)
		{
			player.angularDirection = 0;
		}
		if(event.keyCode == KEY_A)
		{
			player.directionX = 0;
		}
		if(event.keyCode == KEY_S)
		{
			player.directionX = 0;
		}
		if(event.keyCode == KEY_SPACE)
		{
			shoot = false; // keep firing var.
		}
		if(event.keyCode == KEY_D)
		{
			debug = !debug;
		}
	}
	// Splash Controls
	else if (gameState == STATE_SPLASH)
	{
		if(event.keyCode == KEY_SPACE)
		{
			countDownToStartGame = true;
		}
	}

	// Extras:
	if(event.keyCode == 49) // Btn One.
	{
		changeShip(1); // Small Ship
	}
	if(event.keyCode == 50) // Btn Two.
	{
		changeShip(2); // Small Ship
	}
}

var planeNumber = 1; // Current Plane.

// Change the Players Plane.
function changeShip(shipNumber)
{
	planeNumber = shipNumber;
	switch(shipNumber)
	{
		case 1:
			player.image.src = "ship.png";
			player.width = 60;
			player.height = 60;
			PLAYER_TURN_SPEED = 0.06;
			PLAYER_SPEED = 1;
			break;
		case 2:
			player.image.src = "ship_2.png";
			player.width = 93;
			player.height = 80;
			PLAYER_TURN_SPEED = 0.04;
			PLAYER_SPEED = 0.75;
			break;
	}
}

// Draw background.
function drawBackground()
{
	for(var y=0; y<15; y++)
	{
		for(var x=0; x<20; x++)
		{
			context.drawImage(background[y][x], x*32, y*32);
		}
	}
}

// Test to see if 2 rectangles intersect.
function intersects(x1, y1, w1, h1, x2, y2, w2, h2)
{
	if(y2 + h2 < y1 || x2 + w2 < x1 || x2 > x1 + w1 || y2 > y1 + h1)
	{
		return false;
	}
	return true;
}

function run()
{
	var deltaTime = getDeltaTime();
	currentDeltaTime = deltaTime;
	context.fillStyle = "#ccc";
	context.fillRect(0, 0, canvas.width, canvas.height);

	switch(gameState)
	{
		case STATE_SPLASH:
			runSplash(deltaTime);
			break;
		case STATE_GAME:
			runGame(deltaTime)
			break;
		case STATE_GAMEOVER:
			runGameOver(deltaTime)
			break;
	}

}

var splashTimer = 0.25;
var flashTimer = 1.5;
var flash = true;
var countDownToStartGame = false;

function runSplash(deltaTime)
{
	context.fillStyle = "#292929";
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (countDownToStartGame)
	{
		splashTimer -= deltaTime;
		if(splashTimer <=0)
		{
			countDownToStartGame = false;
			gameState = STATE_GAME; // Move to Game Screen.
			return;
		}
	}
	
	// Make text flash.
	flashTimer -= deltaTime;
	if(flashTimer <=0)
	{
		flash = !flash;
		flashTimer = 0.8;
	}

	if (!countDownToStartGame)
	{
		if(flash)
		{
			context.fillStyle = "#f4f4f4";
			context.font = "20px VT323";
			context.fillText("PRESS SPACE TO START", canvas.width/2, 400);
		}
	}

	var my_gradient = context.createLinearGradient(0,0,0,150);
	my_gradient.addColorStop(0, "#9FC8D6");
	my_gradient.addColorStop(1, "#2C5766");
	context.fillStyle = my_gradient;

	context.font = "55px VT323";
	context.textAlign = "center"; 
	context.fillText("ASTEROIDS GAME", canvas.width/2, 130);

	// Draw box around
	context.strokeStyle = "#4D94DB";
	context.lineWidth = 1;
	context.rect(220,370,200,50);
	context.stroke();
	context.fillStyle = "rgba(0, 0, 200, 0.2)";
	context.fill();
}

function runGame(deltaTime)
{
	drawBackground();

	// Keep firing if button held down.
	if (shoot)
	{
		playerShoot();
	}

	// Update the shoot timer.
	if (shootTimer > 0)
	{
		shootTimer -= deltaTime;
	}

	// Update all the bullets.
   	for(var i=0; i<bullets.length; i++)
	{
		bullets[i].x += bullets[i].velocityX ;
		bullets[i].y += bullets[i].velocityY ;
	}

	for(var i=0; i<bullets.length; i++)
	{
		// Check if the bullet has gone out of the screen boundaries,
		// if so kill it.
		if(bullets[i].x < -bullets[i].width ||
				bullets[i].x > SCREEN_WIDTH ||
				bullets[i].y < -bullets[i].height ||
				bullets[i].y > SCREEN_HEIGHT) 
		{
			// Remove 1 element at position i.
			bullets.splice(i, 1);
			// We can only remove 1 at a time so break.
			break;
		}
	}

	// Draw all the bullets.
	for(var i=0; i<bullets.length; i++)
	{
		context.drawImage(bullets[i].image,
		bullets[i].x - bullets[i].width/2,
		bullets[i].y - bullets[i].height/2);
	}

	// Update all the asteroids in the asteroids array.
	for(var i=0; i<asteroids.length; i++)
	{
		// Let the asteroids wrap around screen.
		if (asteroids[i].x > SCREEN_WIDTH + asteroids[i].width){
			asteroids[i].x = 0 - (asteroids[i].width/2);
		} 
		else if(asteroids[i].x < 0 - asteroids[i].width) {
			asteroids[i].x = SCREEN_WIDTH;
		}
		if (asteroids[i].y > SCREEN_HEIGHT + asteroids[i].height){
			asteroids[i].y = 0 - (asteroids[i].height/2);
		}
		else if (asteroids[i].y < 0 - asteroids[i].height)
		{
			asteroids[i].y = SCREEN_HEIGHT;
		}

		// Asteroid Movement.
		asteroids[i].x = asteroids[i].x + (asteroids[i].velocityX * 70 * deltaTime);
		asteroids[i].y = asteroids[i].y + (asteroids[i].velocityY * 70 * deltaTime);
	}
	// Draw the asteroids.
	for(var i=0; i<asteroids.length; i++)
	{
		context.drawImage(asteroids[i].image, asteroids[i].x, asteroids[i].y);		
	}

	// Update spawnTimer.
	spawnTimer-= deltaTime;
	if(spawnTimer <=0)
	{
		spawnTimer = 0.5;
		spawnAsteroid();
	}

	// Calculate sine & cos for the players current rotation.
	var s = Math.sin(player.rotation);
	var c = Math.cos(player.rotation);

	var xDir = (player.directionX * c) - (player.directionY * s);
	var yDir = (player.directionX * s) + (player.directionY * c);

	var xVel = xDir * PLAYER_SPEED;
	var yVel = yDir * PLAYER_SPEED;

	player.x += xVel;
	player.y += yVel;

	player.rotation += player.angularDirection * PLAYER_TURN_SPEED;

	context.save();
	context.translate(player.x, player.y);
	context.rotate(player.rotation);

	// Check if any asteroid intersects with the player
	for(var i=0; i<asteroids.length; i++)
	{
		if(intersects(player.x - (player.width/2 * 0.9), player.y - (player.height/2 * 0.9),
			(player.width * 0.9), (player.height * 0.9),
			asteroids[i].x, asteroids[i].y,
			asteroids[i].width, asteroids[i].height) == true)
		{
			asteroids.splice(i,1);
			// Kill the player.
			player.isDead = true;
			// Game Over.
			gameState = STATE_GAMEOVER;
			break;
		}
	}

	// Keep player inside screen.
	keepPlayerInside();

	// Draw player.
	if (player.isDead == false)
	{
		context.drawImage(player.image, -player.width/2, -player.height/2);
	}
	context.restore();

	// Check if any bullet intersects any asteroid. If so, kill them both.
	for(var i=0; i<asteroids.length; i++)
	{
		for(var j=0; j<bullets.length; j++)
		{
			if(intersects(bullets[j].x, bullets[j].y,
				bullets[j].width, bullets[j].height,
				asteroids[i].x, asteroids[i].y,
				asteroids[i].width, asteroids[i].height) == true)
			{
				bullets.splice(j, 1);
				
				// Only destroy the little ones.
				if(asteroids[i].size == 0 )
				{
					asteroids.splice(i, 1);
					gameScore += 5;
				}
				else if(asteroids[i].size == 1)
				{
					asteroids[i].size = 0;
					asteroids[i].image.src = "rock_small.png";
					asteroids[i].width = 22;
					asteroids[i].height = 20;
					// Move them a little.
					asteroids[i].x += rand(-5, 5);
					asteroids[i].y -= rand(-5, -5);
					
					gameScore += 20;
				}
				else
				{
					asteroids[i].size = 1;
					asteroids[i].image.src = "rock_medium.png";
					asteroids[i].width = 40;
					asteroids[i].height = 50;
					// Move them a little.
					asteroids[i].x += rand(-5, 5);
					asteroids[i].y -= rand(-5, -5);
					
					gameScore += 50;
				}
				break;
			}
		}
	}

	// Add Score to game.
	context.font = "25px VT323";
	context.fillStyle = "#fff";
	context.textAlign = "center";
	context.fillText("SCORE: " + gameScore,canvas.width/2,40);

	if (debug)
	{
		context.fillText("BULLETS: " + bullets.length,canvas.width/2,70);
		context.fillText("ASTEROIDS: " + asteroids.length,canvas.width/2,100);
	}

}

var GameOverTimer = 4.4;
function runGameOver(deltaTime)
{
	GameOverTimer -= deltaTime;
	if(GameOverTimer <=0)
	{
		// Reset all the game items.
		player.directionY = 0;
		player.directionX = 0;
		player.angularDirection = 0;
		shoot = false;
		bullets = [];
		player.isDead = false;
		gameScore = 0;
		GameOverTimer = 4;
		splashTimer = 0.25;
		countDownToStartGame = false;
		gameState = STATE_SPLASH;
		return;
	}

	drawBackground();

	// Update high score
	if(gameScore >= gameHighScore)
	{
		gameHighScore = gameScore;
		
		context.font = "28px VT323";
		context.fillStyle = "yellow";
		context.textAlign = "center";
		context.fillText("THIS IS A NEW HIGH SCORE !!!", canvas.width/2, 310);
	}

	var my_gradient = context.createLinearGradient(0,0,0,150);
	my_gradient.addColorStop(0, "#9FC8D6");
	my_gradient.addColorStop(1, "#2C5766");
	context.fillStyle = my_gradient;

	context.font = "55px VT323";
	context.textAlign = "center"; 
	context.fillText("GAME OVER", canvas.width/2, 100);

	// Display High Score.
	context.fillStyle = "purple";
	context.font = "35px VT323";
	context.textAlign = "center";
	context.fillText("RECORD SCORE: " + gameHighScore, canvas.width/2, 200);

	// Display Your Score.
	context.fillStyle = "#f4f4f4";
	context.font = "50px VT323";
	context.textAlign = "center";
	context.fillText("YOUR SCORE: " + gameScore, canvas.width/2, 360);
}

// Keep the Player inside the canvas.
function keepPlayerInside(){
	if (player.x > SCREEN_WIDTH - (player.width/2) )
	{
		player.x = SCREEN_WIDTH - (player.width/2) ;
	}
	else if (player.x < 0 + (player.width/2) )
	{
		player.x = 0 + (player.width/2) ;
	}
	
	if (player.y > SCREEN_HEIGHT - (player.height/2) )
	{
		player.y = SCREEN_HEIGHT - (player.height/2);
	}
	else if (player.y < 0 + (player.height/2))
	{
		player.y = 0 + (player.height/2);
	}
}

// Call the run function 60FPS.
(function() {
	var onEachFrame;
	if (window.requestAnimationFrame) {
		onEachFrame = function(cb){
			var _cb = function(){
				cb();
				window.requestAnimationFrame(_cb);
			}
			_cb();
		};
	} else if (window.mozRequestAnimationFrame){
		onEachFrame = function(cb){
			var _cb = function(){
				cb();
				window.mozRequestAnimationFrame(_cb);
			}
			_cb();
		};
	} else {
		onEachFrame = function(cb){
			setInterval(cb, 1000 / 60);
		}
	}
	
	window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);