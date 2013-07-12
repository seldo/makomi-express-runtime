/**
 * Helper functions that makomi-express uses to extend Handlebars.
 * Runtime should not parse HTML at runtime.
 * Runtime should use handlebars features as much as possible for efficiency.
 */

var fs = require('fs'),
  hb = require('handlebars'),
  _ = require('underscore'),
  util = require('util');

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
exports.compile = function(layout,cb,alternateRoot) {

  console.log("Processing:")
  console.log(layout)

  var viewRoot = exports.templateRoot
  if(alternateRoot) viewRoot = alternateRoot

  // render the full view via handlebars -- but not yet
  var renderView = function(file,context,cb) {
    var templateFile = viewRoot + file + exports.templateExtension
    fs.readFile(templateFile,'utf-8',function(er,data) {
      if (er) {
        console.log("Failed to read template file at " + templateFile)
        cb('') // return blank string
      } else {
        var renderedView = exports.renderFragment(data,context)
        cb(renderedView)
      }
    })
  }

  // compile all children first, recursively
  if(layout.templates) {

    var mergeContext = function(template,parentContext) {
      for(var p in parentContext) {
        if (!template.context.hasOwnProperty(p)) {
          template.context[p] = parentContext[p]
        }
      }
      return template
    }

    // handle trivial case
    if (_.size(layout.templates) == 0) {
      console.log("Empty set of templates")
      renderView(layout.source,layout.context,cb)
    }

    for(var slotName in layout.templates) {

      var template = layout.templates[slotName]
      var complete = function() {
        // render when all children are done
        console.log("All templates compiled: " + layout.context.name)
        renderView(layout.source,layout.context,cb)
      }

      var compileChild = function(template,cb,ref) {
        exports.compile(template,function(renderedView) {
          cb(renderedView,ref)
        },alternateRoot)
      }

      if(!util.isArray(template)) {
        console.log("basic template: " + slotName)
        // compile the template into a string and put it into the context
        template = mergeContext(template,layout.context)
        compileChild(template,function(renderedView) {
          layout.context[slotName] = renderedView
          complete()
        })
      } else {
        console.log("list of templates: " + slotName)
        // compile each of the list of templates into strings
        // then concatenate them into one big string in the context
        var templateList = template
        var compiledTemplates = []
        var subCount = templateList.length
        console.log("Child count: " + subCount)
        var subComplete = function() {
          console.log("subcomplete")
          console.log(compiledTemplates)
          subCount--
          if (subCount == 0) {
            layout.context[slotName] = compiledTemplates.join("\n")
            complete()
          }
        }
        templateList.forEach(function(template,index) {
          template = mergeContext(template,layout.context)
          compileChild(template,function(renderedView) {
            compiledTemplates[index] = renderedView
            subComplete()
          })
        })
      }

    }

  } else {
    // if no kids, go straight to rendering
    console.log("No templates, processing")
    renderView(layout.source,layout.context,cb)
  }

}