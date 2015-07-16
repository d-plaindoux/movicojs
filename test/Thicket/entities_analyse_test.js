'use strict';

var entities = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/checker/entities.js'),
    ast = require('../../lib' + (process.env.THICKET_COV || '') + '/Thicket/compiler/syntax/ast.js'),
    pair = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/pair.js'),
    list = require('../../lib' + (process.env.THICKET_COV || '') + '/Data/list.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['entities_analyse'] = {
  setUp: function(done) {
      done();
  },

  "Analyse empty controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],ast.param("this",ast.type.variable("number")),[],[]));
      test.ok(entities.analyse(list(), list(), list(), list(), [aController]).isSuccess(),
              "Empty controller");
      test.done();
  },
    
  "Analyse simple controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.type.variable("number")),
                                       [ ast.param("m", ast.type.variable("number")) ],
                                       [ ast.method("m", ast.expr.number(1)) ]));
      test.ok(entities.analyse(list(), list(), list(), list(), [aController]).isSuccess(),
              "Simple controller");
      test.done();
  },

  "Analyse simple wrong controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.type.variable("number")),
                                       [ ast.param("m", ast.type.variable("string")) ],
                                       [ ast.method("m", ast.expr.number(1)) ]));
      test.ok(entities.analyse(list(), 
                               list(), 
                               list(), 
                               list(pair("string",ast.type.native("string")),
                                    pair("number",ast.type.native("number"))), 
                               [aController]).isFailure(),
              "Simple wrong controller");
      test.done();
  },
    
  "Analyse simple partial controller": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.type.variable("number")),
                                       [ ],
                                       [ ast.method("m", ast.expr.number(1)) ]));
      test.ok(entities.analyse(list(), list(), list(), list(), [aController]).isFailure(),
              "Simple partial controller");
      test.done();
  },
    
  "Analyse simple controller using this": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.type.variable("number")),
                                       [ ast.param("m", ast.type.variable("number")) ],
                                       [ ast.method("m", ast.expr.ident("this")) ]));
      test.ok(entities.analyse(list(), list(), list(), list(), [aController]).isSuccess(),
              "This referencing controller");
      test.done();
  },
    
  "Analyse simple controller using self": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.type.variable("number")),
                                       [ ast.param("m", ast.type.variable("number")) ],
                                       [ ast.method("m", ast.expr.invoke(ast.expr.ident("self"), "m")) ]));
      test.ok(entities.analyse(list(), list(pair("A", aController)), list(), list(), [aController]).isSuccess(),
              "Self referencing controller");
      test.done();
  },
    
  "Analyse simple controller returning self": function (test) {
      test.expect(1);
      // Test
      var aController = ast.entity("A",
                                   ast.controller("A",[],
                                       ast.param("this",ast.type.variable("number")),
                                       [ ast.param("m", ast.type.variable("A")) ],
                                       [ ast.method("m", ast.expr.ident("self")) ]));
      test.ok(entities.analyse(list(), list(pair("A", aController)), list(), list(), [aController]).isSuccess(),
              "Self referencing controller");
      test.done();
  },
};
