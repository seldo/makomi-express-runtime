/**
 * Helper functions that makomi-express uses to extend Handlebars.
 * Runtime should not parse HTML at runtime.
 * Runtime should use handlebars features as much as possible for efficiency.
 */

var fs = require('fs'),
    hb = require('handlebars'),
    _ = require('underscore');

exports.templateRoot = process.cwd() + '/views/'
exports.templateExtension = '.hbs'
exports.util = require('./util.js')

// HELPER: #key_value
//
// Usage: {{#key_value obj}} Key: {{key}} // Value: {{value}} {{/key_value}}
//
// Iterate over an object, setting 'key' and 'value' for each property in
// the object.
hb.registerHelper("key_value", function(obj, options) {
  var buffer = "",
    key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      buffer += options.fn({key: key, value: obj[key]});
    }
  }

  return buffer;
});

// HELPER: #each_with_key
//
// Usage: {{#each_with_key container key="myKey"}}...{{/each_with_key}}
//
// Iterate over an object containing other objects. Each
// inner object will be used in turn, with an added key ("myKey")
// set to the value of the inner object's key in the container.
hb.registerHelper("each_with_key", function(obj, options) {
  var context,
    buffer = "",
    key,
    keyName = options.fn.hash.key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      context = obj[key];

      if (keyName) {
        context[keyName] = key;
      }

      buffer += options.fn(context);
    }
  }

  return buffer;
});

/**
 * Render any source fragment
 * @param source
 * @param context
 * @returns {*}
 */
exports.renderFragment = function(source,context) {

  /**
   * HELPER &Recurse
   *
   * Usage: {{&Recurse array}}
   *
   * When using renderFragment, calling Recurse will call the current
   * template again using a new object.
   * This works because "source" is supplied by renderFragment itself. Magic!
   */
  hb.registerHelper('Recurse',function(children, options) {
    var template = hb.compile(source);
    return template(children);
  });

  var template = hb.compile(source);
  return template(context)
}

/**
 * Given a tree of templates and contexts, do a depth-first rendering of
 * the entire tree and return the result.
 * TODO: caching, optimization
 * @param layout
 * @param cb
 */
exports.compile = function(layout,cb) {

  console.log("Compiling " + layout.source)

  // render the full view via handlebars -- but not yet
  var renderView = function(file,context,cb) {
    var templateFile = exports.templateRoot + file + exports.templateExtension
    console.log("Rendering template " + templateFile)
    fs.readFile(templateFile,'utf-8',function(er,data) {
      var renderedView = exports.renderFragment(data,context)
      cb(renderedView)
    })
  }

  // compile all children first, recursively
  if(layout.templates) {

    var templateCount = Object.keys(layout.templates).length
    var templateHandled = function() {
      templateCount--;
      if (templateCount == 0) {
        renderView(layout.source,layout.context,cb)
      }
    }

    for(var t in layout.templates) {

      if (layout.context) {
        // merge parent context into child
        for (var p in layout.context) {
          if (!layout.templates[t].context[p]) {
            layout.templates[t].context[p] = layout.context[p]
          }
        }
      } else {
        layout.context = {}
      }

      // compile child and spit result into string
      exports.compile(layout.templates[t],function(renderedView) {
        layout.context[t] = renderedView;
        templateHandled()
      })
    }
  } else {
    // if no kids, go straight to rendering
    renderView(layout.source,layout.context,cb)
  }

}