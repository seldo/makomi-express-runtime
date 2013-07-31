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
exports.renderFragment = function(source,context,cb) {
  var template = hb.compile(source);
  cb(template(context))
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

  //console.log("Processing:")
  //console.log(layout)

  if(!layout.context) layout.context = {}

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
        exports.renderFragment(data,context,function(renderedView) {
          cb(renderedView)
        })
      }
    })
  }

  // compile all children first, recursively
  if(layout.templates) {

    var mergeContext = function(template,parentContext) {
      if(!template.context) template.context = {}
      for(var p in parentContext) {
        if (!template.context.hasOwnProperty(p)) {
          template.context[p] = parentContext[p]
        }
      }
      return template
    }

    // handle trivial case
    if (_.size(layout.templates) == 0) {
      //console.log("Empty set of templates")
      renderView(layout.source,layout.context,cb)
    }

    // replace all named slots
    _.each(layout.templates,function(template,slotName) {

      var complete = function() {
        // render when all children are done
        renderView(layout.source,layout.context,cb)
      }

      var compileChild = function(template,cb) {
        exports.compile(template,function(renderedView) {
          cb(renderedView)
        },alternateRoot)
      }

      if(!util.isArray(template)) {
        // compile the template into a string and put it into the context
        template = mergeContext(template,layout.context)
        compileChild(template,function(renderedView) {
          layout.context[slotName] = renderedView
          complete()
        })
      } else {
        // compile each of the list of templates into strings
        // then concatenate them into one big string in the context
        var templateList = template
        var compiledTemplates = []
        var subCount = _.keys(templateList).length // some items may be missing
        var subComplete = function() {
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

    })

  } else {
    // if no kids, go straight to rendering
    //console.log("No sub-templates, processing " + layout.source)
    renderView(layout.source,layout.context,cb)
  }

}