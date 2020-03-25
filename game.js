//Scene stuff
var canvas = document.getElementById("canvas");

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
camera.up.set(0, 0, 1);
camera.position.z = 16;

//Renderer
var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: canvas });
//renderer.setSize(canvas.parentNode.offsetWidth, canvas.parentNode.offsetHeight);

//Controls
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.target.set(0, 0, 0.2);
controls.update();

//Raycaster
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

//Loaders
var textureLoader = new THREE.TextureLoader();
var objLoader = new THREE.OBJLoader();
var plyLoader = new THREE.PLYLoader();

//Gamefield
var gamefield = [];

//Field Geometry/Materials
var fieldBorderGeometry = new THREE.CircleGeometry(0.45, 32);
var fieldBorderMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

var fieldGeometry = new THREE.CircleGeometry(0.4, 32);
var fieldMaterial = new THREE.MeshBasicMaterial({color: 0xFFEBCD});

//Gamerules
var gamerules = {
	longSide: 6,
	shortSide: 3,
	numPlayers: 4,			//Currently hardcoded to 4!
	numPuppets: 4,			//Amount of puppets each player has
	jumpInHouse: false,
	clearExit: false,
	sixForceExit: false,
	crossJunction: false,
	backwardsAttack: false
};

//Dice
var porcelainMatcap = textureLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/matcaps/matcap-porcelain-white.jpg");
var dice;
var diceRot = [
	new THREE.Euler(-Math.PI/2, 0, 0), //1
	new THREE.Euler(0, Math.PI/2, 0),  //2
	new THREE.Euler(Math.PI, 0, 0),    //3
	new THREE.Euler(0, 0, 0),          //4
	new THREE.Euler(0, -Math.PI/2, 0), //5
	new THREE.Euler(Math.PI/2, 0, 0)   //6
];

//Players
var defaultPlayerMaterial = [
	new THREE.MeshMatcapMaterial({ color: 0xff5555, matcap: porcelainMatcap }), //Player 1
	new THREE.MeshMatcapMaterial({ color: 0x55ff55, matcap: porcelainMatcap }), //Player 2
	new THREE.MeshMatcapMaterial({ color: 0x5555ff, matcap: porcelainMatcap }), //Player 3
	new THREE.MeshMatcapMaterial({ color: 0xfff055, matcap: porcelainMatcap })  //Player 4
];
var DefaultPlayerGeometry = new THREE.ConeGeometry(0.35, 1, 8);
var players = [];

class Player
{
	constructor(name, startIndex, finishIndex, house, material)
	{
		this.name = name;
		this.puppets = [];				//Handles for all puppets
		this.house = house;				//Handles for goal positions
		this.startIndex = startIndex;	//Index of start
		this.finishIndex = finishIndex;	//Index of house entry
		this.material = material;		//Player material
	}
}

class Puppet
{
	constructor(puppetMesh, index, owningPlayer)
	{
		this.index = index;
		this.puppetMesh = puppetMesh;
		this.player = owningPlayer;

		this.jump();
	}

	move(amount)
	{
		this.index += amount;
		if(index <= this.player.finishIndex)
			this.puppetMesh.position.copy(gamefield[this.index]);
		else
			console.log("Player " + this.player.name + " has reached the goal!");
	}

	jump(index)
	{
		if(index)
			this.index = index;
		else
			this.index = this.player.startIndex;

		if(index <= finishIndex)
			this.puppetMesh.position.copy(gamefield[index]);
		else
			console.log("Player " + this.player.name + " has reached the goal!");
	}
}

init();

function init()
{
	generateGamefield(gamerules.longSide, gamerules.shortSide);

	//Load Dice
	plyLoader.load(
		'models/Dice.ply',
		// called when resource is loaded
		function ( object ) 
		{
			dice = new THREE.Mesh(object, new THREE.MeshMatcapMaterial({ color: 0xfffbfa, vertexColors: THREE.VertexColors, matcap: porcelainMatcap }));
			dice.position.z = 2;
			scene.add(dice);
		},

		// called when loading is in progresses
		function ( xhr ) 
		{
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		
		// called when loading has errors
		function ( error ) 
		{
			console.log('An error happened');
		}
	);

	objLoader.load(
		'models/DefaultPlayer.obj',
		// called when resource is loaded
		function ( object ) 
		{/*
			for(var i=0; i<4; i++)
			{
				var player = object.children[0].clone(); 
				player.material = defaultPlayerMaterial[i];
				player.rotateX(Math.PI/2);
				player.position.copy(gamefield[i]);
				player.scale.x = 0.2;
				player.scale.y = 0.2;
				player.scale.z = 0.2;
				players[players.length] = player;
				scene.add(player);
			}*/
			var player = new THREE.Mesh(DefaultPlayerGeometry, defaultPlayerMaterial[0]);
			player.rotateX(Math.PI/2);
			player.position.z = 0.5;
			scene.add(player);

		},

		// called when loading is in progresses
		function ( xhr ) 
		{
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		
		// called when loading has errors
		function ( error ) 
		{
			console.log( 'An error happened' );
		}
	);

}

function generateGamefield(longSide = 5, shortSide = 3)
{
	if(!Number.isInteger(longSide) || !Number.isInteger(shortSide))
		return;

	var x = 0-longSide;
	var y = shortSide-2;

	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x++, y, 0);
	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x, y++, 0);
	for(var i=1; i<shortSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x++, y, 0);

	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x, y--, 0);
	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x++, y, 0);
	for(var i=1; i<shortSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x, y--, 0);

	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x--, y, 0);
	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x, y--, 0);
	for(var i=1; i<shortSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x--, y, 0);

	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x, y++, 0);
	for(var i=1; i<longSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x--, y, 0);
	for(var i=1; i<shortSide; i++)
		gamefield[gamefield.length] = new THREE.Vector3(x, y++, 0);

	//Load Players
	for(var i=0; i<gamerules.numPlayers; i++)
	{
		var house = [];
		var startIndex = mod((gamefield.length/gamerules.numPlayers * i), gamefield.length);
		var houseIndex = mod((startIndex - 1), gamefield.length);

		for(var j=1; j<=gamerules.numPuppets; j++)
		{
			house[house.length] = gamefield[houseIndex].clone();
			switch(i)
			{
				case 0: house[house.length-1].x += j; break;
				case 1: house[house.length-1].y -= j; break;
				case 2: house[house.length-1].x -= j; break;
				case 3: house[house.length-1].y += j; break;
				default: console.error("Amount of players is currently hardcoded to 4!!!"); break;
			}
		}

		players[players.length] = new Player(
			"Player " + (i+1), 
			startIndex,
			houseIndex,
			house, defaultPlayerMaterial[i]
		);
	}

	//Create Walkway Meshes
	for(var i=0; i<gamefield.length; i++)
	{
		var fieldBorderMesh = new THREE.Mesh(fieldBorderGeometry, fieldBorderMaterial);
		fieldBorderMesh.position.x = gamefield[i].x;
		fieldBorderMesh.position.y = gamefield[i].y;
		fieldBorderMesh.position.z = -0.01;
		scene.add(fieldBorderMesh);

		var fieldMesh;
		if(i%(gamefield.length/gamerules.numPlayers) === 0)
			fieldMesh = new THREE.Mesh(fieldGeometry, players[i/(gamefield.length/gamerules.numPlayers)].material);
		else
			fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);

		fieldMesh.position.x = gamefield[i].x;
		fieldMesh.position.y = gamefield[i].y;
		scene.add(fieldMesh);
	}

	//Create House Meshes
	for(var i=0; i<gamerules.numPlayers*gamerules.numPuppets; i++)
	{
		var player = Math.floor(i%gamerules.numPlayers);
		var index = Math.floor(i/gamerules.numPlayers);
		var fieldBorderMesh = new THREE.Mesh(fieldBorderGeometry, fieldBorderMaterial);
		fieldBorderMesh.position.x = players[player].house[index].x;
		fieldBorderMesh.position.y = players[player].house[index].y;
		fieldBorderMesh.position.z = -0.01;
		scene.add(fieldBorderMesh);

		var fieldMesh = new THREE.Mesh(fieldGeometry, players[player].material);
		fieldMesh.position.x = players[player].house[index].x;
		fieldMesh.position.y = players[player].house[index].y;
		scene.add(fieldMesh);
	}
}

function gameloop()
{

}

var warscheinlich = [0, 0, 0, 0, 0, 0];

function rollDice()
{
	var res = Math.floor(Math.random() * 6 / (1 - 0) + 1);
	warscheinlich[res-1] = warscheinlich[res-1] + 1;
	if(dice)
		dice.setRotationFromEuler(diceRot[res-1]);
	return res;
}

function resize() 
{
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	renderer.setViewport(0, 0, canvas.offsetWidth, canvas.offsetHeight)
	camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
	camera.updateProjectionMatrix();
}

var render = function () 
{
	requestAnimationFrame(render);
	controls.update();

	resize();

	if(!dice)
		return;

	renderer.render(scene, camera);
};

function onMouseMove( event ) 
{
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = (event.clientX / canvas.width) * 2 - 1;
	mouse.y = - (event.clientY / canvas.height) * 2 + 1;
}
canvas.addEventListener('mousemove', onMouseMove, false);

function onMouseClick(event)
{
	raycaster.setFromCamera(mouse, camera);
	if(raycaster.intersectObject(dice).length > 0)
		console.log("Dice: " + rollDice());
}
canvas.addEventListener('click', onMouseClick);

function mod(n, m) {
	return ((n % m) + m) % m;
}

render();