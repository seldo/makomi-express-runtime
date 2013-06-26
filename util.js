var fs = require('fs')

/**
 * Load the app config from a file, or provide default config
 */
exports.loadConfig = function(path,cb) {

  var defaultConfig = {
    sessions: {
      key: 'mks',
      secret: 'default secrets are not really secret, are they?'
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
