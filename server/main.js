var app = require('./app.js');
var http = require('http');

var port = process.env.PORT || '4000';
app.set('port', port);

var server = http.createServer(app);
var io = require('socket.io')(server);
var gameServer = require('./server.js')(io);

server.listen(port, function () {
  console.log('Listening on ' + port);
});
