/**
 * Converts socket messages into ordinary controller requests.
 * Message data must be of type "controller-action-in" and have
 * properties "controller" and "action" to be routed correctly.
 * A "controller-action-out" message with the same data is immediately
 * emitted (without waiting for any action on the controller)
 * @param socketServer A socket.io server
 * @param root The root of the app the controllers will be in
 */
exports.start = function(socketServer,root) {
  socketServer.on('sconnection', function (client,session) {

    // route all controller-action events as if they happened to a real controller
    client.on('controller-action-in', function(data) {
      // FIXME: session/project is not universal enough
      data.project = session['project']
      socketServer.sockets.emit('controller-action-out',data)
      var controllerName = data.controller
      var action = data.action
      var controller = require(root+'/controllers/'+controllerName+'/'+action)
      controller(session,data)
    });

    client.on('disconnect', function () {
      socketServer.sockets.emit('user disconnected');
    });
  });
}