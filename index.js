var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var screen;

app.use(express.static('public'))

app.get('/screen', function(req, res){
    res.sendFile(__dirname + '/public/screen.html');
});

app.get('/controller', function(req, res){
    res.sendFile(__dirname + '/public/controller.html');
});

io.on('connection', function(socket){
    socket.on('disconnect', function() {
        console.log('Gamepad disconnected');
        if (screen){
            screen.emit('gamepadDisconnected', socket.id)
        }
    });
    socket.on('connectGamepad', function() {
        console.log('Gamepad connected')
        socket.gamePadId = 1;
        socket.emit('gamepadConnected', {
            padId: 1
        });
        screen.emit('gamepadConnected', socket.id)
    });
    socket.on('padEvent', function(data) {
        data['id'] = socket.id;
        console.log(data['id'] + ' ' + data['type'] + ' ' + data['code'] + ' ' + data['value']);
        screen.emit('padEvent', data)
    });
    socket.on('screen_connected', function () {
        console.log('Screen connected');
        screen = socket;
    });
});

http.listen(4700, function(){
    console.log('listening on *:4700');
});