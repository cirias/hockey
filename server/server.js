function server (io) {
  io.on('connection', function (socket) {
    console.log('connected');

    socket.on('ping', function () {
      socket.emit('pong');
    });
  });

}

module.exports = server;
