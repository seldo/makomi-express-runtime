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
exports.misc = require('./misc.js')

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
 * FIXME: the parameter order here is gross.
 * FIXME: the whole concept of originalRef seems like a hack.
 * @param layout
 * @param cb
 */
exports.compile = function(layout,cb,alternateRoot,originalRef) {

  console.log("Called with original ref " + originalRef)

  var viewRoot = exports.templateRoot
  if(alternateRoot) viewRoot = alternateRoot

  // render the full view via handlebars -- but not yet
  var renderView = function(file,context,cb) {
    var templateFile = viewRoot + file + exports.templateExtension
    fs.readFile(templateFile,'utf-8',function(er,data) {
      if (er) {
        console.log("Failed to read template file at " + templateFile)
        cb('',originalRef) // return blank string
      } else {
        var renderedView = exports.renderFragment(data,context)
        cb(renderedView,originalRef)
      }
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

      if (!layout.templates[t].context) layout.templates[t].context = {}

      if (layout.context) {
        // merge parent context into child
        for (var p in layout.context) {
          if (!layout.templates[t].context.hasOwnProperty(p)) {
            layout.templates[t].context[p] = layout.context[p]
          }
        }
      } else {
        layout.context = {}
      }

      console.log("Compiled context for template " + t)
      console.log(layout.templates[t])

      // compile child and spit result into string
      exports.compile(layout.templates[t],function(renderedView,passedRef) {
        console.log("Ref passed back was " + passedRef)
        layout.context[passedRef] = renderedView;
        templateHandled()
      },alternateRoot,t)
    }
  } else {
    // if no kids, go straight to rendering
    renderView(layout.source,layout.context,cb)
  }

}