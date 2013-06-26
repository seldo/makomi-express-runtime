var fs = require('fs')

exports.loadConfig = function(path,cb) {

  var defaultConfig = {
    directories: {
      workspace: __dirname + '/workspace/',
      makomi: '.makomi/'
    },
    files: {
      makomi: 'makomi.json',
      routes: 'routes.json'
    },
    sessions: {
      key: 'mks',
      secret: 'some secret key here'
    }
  }

  if(!path) {
    return defaultConfig
  } else {
    fs.readFile(path,'utf-8',function(er,data) {
      if(er) {
        throw new Exception(er);
      }
      if(data) {
        // FIXME: handle parse errors
        var config = JSON.parse(data);
        // overwrite any and everything in the defaults
        for(var p in config) {
          defaultConfig[p] = config[p]
        }
        cb(defaultConfig)
      } else {
        throw new Exception("No config file at " + path)
      }
    })
  }

}