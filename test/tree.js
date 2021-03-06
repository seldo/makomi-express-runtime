var mkRun = require('../index.js');

var layout = {
  source: "layouts/default",
  context: {
    "title": "I am a tree"
  },
  templates: {
    "body": {
      source: "basic/tree",
      context: {
        "children": [
          {
            name:"Branch1",
            value:1,
            children: [
              {
                name:"Branch1-1",
                value:11
              },
              {
                name:"Branch1-2",
                value:12,
                children: [
                  {
                    name: "Branch1-2-1",
                    value: 121
                  },
                  {
                    name: "Branch1-2-2",
                    value: 122
                  }
                ]
              },
              {
                name:"Branch1-3",
                value:13
              }
            ]
          },
          {
            name:"Branch2",
            value:2,
            children: [
              {
                name: "Branch2-1",
                value: 21
              },
              {
                name: "Branch2-2",
                value: 22
              },
              {
                name: "Branch2-3",
                value: 23
              }
            ]
          },
          {name:"Branch3","value":3}
        ]
      }
    }
  }
}

mkRun.compile(layout,function(renderedView) {
  console.log("View rendered:")
  console.log(renderedView)
},process.cwd()+'/test/views/')