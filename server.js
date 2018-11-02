let express = require('express')
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

const PLAYER_SIZE = 4;

let tickRate = 100;
let tick = 0;
let ids = [];
let players = {};
let bounds = {
	w: 1000,
	h: 1000
};

app.use(express.static('.'));

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/pointandclick.html');
})

http.listen(80, function(){

});

io.on('connection', function(socket){
  console.log('connecting', socket.id);

	io.of('/').in('main lobby').clients((err, clients)=>{
		for (let i of clients) {
			socket.emit('hello', i);
		}
	});
	socket.join('main lobby');
	socket.broadcast.emit('hello', socket.id);
	newPlayer(socket.id);

	socket.on('wasd', (wasd)=>{
		players[socket.id].wasd = wasd;
	});
	socket.on('update', (x, y, mx, my)=>{
		if(!players[socket.id]) {
			players[socket.id] = {};
		}
		players[socket.id].x = x;
		players[socket.id].y = y;
		//players[socket.id].mx = mx
		//players[socket.id].my = my
		//console.log('update', x, y, socket.id);
		//socket.broadcast.emit('update', x, y, socket.id);
		//let index = ids.indexOf(socket.id);
		//if (!p[index]) {
		//	console.log('couldn\'t find '+socket.id+' in p[]');
		//	return;
		//}
		//p[index].x = x;
		//p[index].y = y;
	});
	socket.on('disconnect', ()=>{
		console.log('disconnecting', socket.id);
		//socket.broadcast.emit('bye', socket.id);
		//io.to('main lobby').emit('bye', socket.id);
		removePlayer(socket.id);
	});
	socket.on('click', (x, y)=>{
		console.log('click', x, y);
		for (let id of Object.keys(players)) {
			if (dist(players[id],{x:x,y:y}) <= PLAYER_SIZE) {
				if (io.of('/').connected[id]) {
					io.of('/').connected[id].emit('die');
				} else {
					console.log(socket.id+' killed a ghost! - '+id);
					delete players[id];
				}
				players[socket.id].x=Math.random()*bounds.w;
				players[socket.id].y=Math.random()*bounds.h;
				boundsCheck(players[socket.id]);
			}
		}
	});
});

function update() {
	tick++;
	for (let id of Object.keys(players)) {
		let wasd = players[id].wasd
		let speed = 5;
		if (wasd & 0x8) {
			players[id].y -= speed;
		}
		if (wasd & 0x4) {
			players[id].x -= speed;
		}
		if (wasd & 0x2) {
			players[id].y += speed;
		}
		if (wasd & 0x1) {
			players[id].x += speed;
		}
		boundsCheck(players[id]);
	}
	if (Object.keys(players).length > 0) {
		io.to('main lobby').emit('update', players, tick);
	}
}
setInterval(update, tickRate);

function dist(o1, o2) {
	return Math.sqrt(Math.pow(o1.x-o2.x, 2) + Math.pow(o1.y-o2.y, 2));
}

function newPlayer(id) {
	players[id] = {
		x:0,y:0,
		r:PLAYER_SIZE,
//		m:{
//			x: 0,
//			y: 0
//		}
	};
}

function removePlayer(id) {
	for (let i of Object.keys(players)) {
		if (id == i) {
			delete players[id];
		}
	}
}

function boundsCheck(o) {
	if (o.x > bounds.w/2) {
		o.x -= bounds.w;
	}
	if (o.x < -bounds.w/2) {
		o.x += bounds.w;
	}
	if (o.y > bounds.h/2) {
		o.y -= bounds.h;
	}
	if (o.y < -bounds.h/2) {
		o.y += bounds.h;
	}
}
