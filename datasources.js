var fs = require('fs-extra')

exports.load = function(cb) {
  fs.readdir("./datasources/",function(er,files) {
    cb()
  })
}