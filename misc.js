/**
 * Bits of code that run at runtime but don't vary between apps
 */

/**
 * A special controller for socket.io
 */
exports.socketController = {
  start: function(socketServer) {
    socketServer.on('sconnection', function (client,session) {

      // FIXME: this should wrap a require to a standard-named function

      client.on('routechange-in', function (data) {
        console.log("Route selected: " + data.route);
        socketServer.sockets.emit('routechange-out', {
          route: data.route,
          project: session['project']
        })
      });

      client.on('disconnect', function () {
        socketServer.sockets.emit('user disconnected');
      });
    });
  }
}