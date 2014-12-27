var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var monitor = require('./monitor.js')
monitor.monitor(app);
monitor.addMonitor(io);
monitor.addMonitor(io.of("/client"));
monitor.addMonitor(io.of("/test"));

app.get('/server/test', function(req,res){	
	res.sendFile(__dirname+'/test.html');
});

app.get('/server/client', function(req,res){	
	res.sendFile(__dirname+'/index.html');
});

io.of('/client').on('connection', function(socket){
	
	socket.on('disconnect',function(){
	});

	socket.on('sendMsg', function(msg){
		console.log('message: ' + msg);
	});
});

io.of('/test').on('connection', function(socket){
	
	socket.on('disconnect',function(){
	});

	socket.on('sendMsg', function(msg){
		console.log('message: ' + msg);
	});
});

http.listen(3000, function(){
	console.log("listenning on * : 3000");
});
