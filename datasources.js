var fs = require('fs-extra')

exports.load = function(cb) {
  fs.readdir("./datasources/",function(er,files) {
    var loaded = {}
    var count = files.length
    if (count == 0) cb(loaded)
    var complete = function() {
      count--
      if (count==0) cb(loaded)
    }
    files.forEach(function(file) {
      loaded[file] = require('./datasources/'+file)
      loaded[file].initialize(complete)
    })
  })
}