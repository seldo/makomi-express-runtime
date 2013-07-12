var mkRun = require('../index.js');

var layout = {
  source: "layouts/default",
  context: {
    "title": "I am a tree"
  },
  templates: {
    "body": {
      "source": "basic/tree2",
      "context": {},
      "templates": {
        "items": [
          {
            "source": "basic/treeitem",
            "context": {
              "name": "Branch1",
              "value": 1
            },
            "templates": {
              "children": {
                "source": "basic/tree2",
                "context": {},
                "templates": {
                  "items": [
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch1-1",
                        "value": 11
                      },
                      "templates": {}
                    },
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch1-2",
                        "value": 12
                      },
                      "templates": {
                        "children": {
                          "source": "basic/tree2",
                          "context": {},
                          "templates": {
                            "items": [
                              {
                                "source": "basic/treeitem",
                                "context": {
                                  "name": "Branch1-2-1",
                                  "value": 121
                                },
                                "templates": {}
                              },
                              {
                                "source": "basic/treeitem",
                                "context": {
                                  "name": "Branch1-2-2",
                                  "value": 122
                                },
                                "templates": {}
                              },
                              {
                                "source": "basic/treeitem",
                                "context": {
                                  "name": "Branch1-2-3",
                                  "value": 123
                                },
                                "templates": {}
                              }
                            ]
                          }
                        }
                      }
                    },
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch1-3",
                        "value": 13
                      },
                      "templates": {}
                    }
                  ]
                }
              }
            }
          },
          {
            "source": "basic/treeitem",
            "context": {
              "name": "Branch2",
              "value": 2
            },
            "templates": {
              "children": {
                "source": "basic/tree2",
                "context": {},
                "templates": {
                  "items": [
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch2-1",
                        "value": 21
                      }
                    },
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch2-2",
                        "value": 22
                      }
                    },
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch2-3",
                        "value": 23
                      }
                    },
                    {
                      "source": "basic/treeitem",
                      "context": {
                        "name": "Branch2-4",
                        "value": 24
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            "source": "basic/treeitem",
            "context": {
              "name": "Branch3",
              "value": 3
            },
            "templates": {}
          }
        ]
      }
    }
  }
}

mkRun.compile(layout,function(renderedView) {
  console.log("View rendered:")
  console.log(renderedView)
},process.cwd()+'/test/views/')