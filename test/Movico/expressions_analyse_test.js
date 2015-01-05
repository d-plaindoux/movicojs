'use strict';

var expression = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/expressions.js').expressions,
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast,
    pair = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/pair.js').pair,
    list = require('../../lib' + (process.env.MOVICO_COV || '') + '/Data/list.js').list;

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

exports['expressions'] = {
  setUp: function(done) {
    done();
  },

  "Analyse Unit": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.unit();
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.native('unit')), 
                     "Must be unit");
      test.done();
  },
    
  "Analyse Number": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.number(1);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.native('number')), 
                     "Must be number");
      test.done();
  },
    
  "Analyse String": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.string("1");
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.native('string')), 
                     "Must be string");
      test.done();
  },
    
  "Analyse free variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Must be unbound");
      test.done();
  },
    
  "Analyse bound variable": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("a");
      test.deepEqual(expression.analyse(list(), list(pair("a", ast.type.native("string"))), anExpression).success(),
                     pair(list(), ast.type.native("string")),
                     "Must be string");
      test.done();
  },

  "Analyse Generalisable same type success": function (test) {
      test.expect(1);
      // Test
      var anExpression  = ast.expr.ident("b");
      test.deepEqual(expression.analyse(list("a"), list(pair("b",ast.type.variable("a"))), anExpression).success(), 
                     pair(list(),ast.type.variable("a")),
                     "Must be generalizable");
      test.done();
  },

  "Analyse Generalisable generic type failure": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.ident("b");
      test.deepEqual(expression.analyse(list(), list(pair("b",ast.type.variable("a"))), anExpression).success(), 
                     pair(list(), ast.type.forall(["a"], ast.type.variable("a"))),
                     "Must be not generalizable");
      test.done();
  },

  "Analyse Simple Generalizable abstraction": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.abstraction("a", ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(),ast.type.forall(["#1"], ast.type.abstraction(ast.type.variable("#1"),ast.type.variable("#1")))),
                     "Must be [a] (a -> a)");
      test.done();
  },
    
  "Analyse let string expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a", ast.expr.string("b"), ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(), ast.type.native("string")),
                     "Must be (string)");
      test.done();
  },
    
  "Analyse let variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.let("a",ast.expr.ident("b"),ast.expr.ident("a"));
      test.deepEqual(expression.analyse(list("c"), list(pair("b",ast.type.variable("c"))), anExpression).success(), 
                     pair(list(), ast.type.variable("c")),
                     "Must be (c)");
      test.done();
  },
    
  "Analyse application variable expression": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.application(ast.expr.abstraction("a",ast.expr.ident("a")), ast.expr.number(12));
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(), 
                     pair(list(pair("#2", ast.type.native("number"))), ast.type.native("number")),
                     "Must be (number)");
      test.done();
  },
        
  "Analyse simple tag": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[]);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(),
                     pair(list(), ast.type.native('xml')),
                     "Simple Tag");
      test.done();
  },
        
  "Analyse simple tag with one attribute": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.string("a")]],[]);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(),
                     pair(list(), ast.type.native('xml')),
                     "Simple Tag with one attribute");
      test.done();
  },
        
  "Analyse simple tag with one attribute but not a string": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.number(1)]],[]);
      test.ok(expression.analyse(list(), list(), anExpression).failure(),
              "Simple Tag with one attribute but not a string");
      test.done();
  },
        
  "Analyse simple tag with one attribute fails": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.ident("a")]],[]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Simple Tag with failing attribute");
      test.done();
  },
        
  "Analyse tag with one embedded tag": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.tag("B",[],[])]);
      test.deepEqual(expression.analyse(list(), list(), anExpression).success(),
                     pair(list(), ast.type.native('xml')),
                     "Tag containing Tag");
      test.done();
  },
        
  "Analyse tag with one embedded string": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.string("a")]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Tag containing String");
      test.done();
  },
   
  "Analyse tag with one embedded number": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.number(1)]);
      test.ok(expression.analyse(list(), list(), anExpression).isFailure(),
              "Tag containing number");
      test.done();
  },
   
  "Analyse tag with one embedded variable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[],[ast.expr.ident("a")]);
      test.deepEqual(expression.analyse(list(), list(pair("a",ast.type.variable("a"))), anExpression).success(),
                     pair(list(pair('a',ast.type.native("xml"))), ast.type.native('xml')),
                     "Tag containing ident");
      test.done();
  },
   
  "Analyse tag with one attribute variable": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.tag("A",[["a",ast.expr.ident("a")]],[]);
      test.deepEqual(expression.analyse(list(), list(pair("a",ast.type.variable("a"))), anExpression).success(),
                     pair(list(pair('a',ast.type.native("string"))), ast.type.native('xml')),
                     "Tag containing ident");
      test.done();
  },
        
  "Analyse invoke a controller": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"x"),
          aController = ast.controller("A",ast.param("this",ast.type.native("number")),
                                       [],
                                       [ast.param("x",ast.type.native("number"))],
                                       [ast.method("x",ast.expr.number(1))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aController)), anExpression).success(),
                     pair(list(), ast.type.native('number')),
                     "Controller invocation");
      test.done();
  },
        
  "Analyse invoke a model": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"x"),
          aModel = ast.model("A",
                             [],
                             [ast.param("x",ast.type.native("number"))]);
      test.deepEqual(expression.analyse(list(), list(pair("A",aModel)), anExpression).success(),
                     pair(list(), ast.type.native('number')),
                     "Model invocation");
      test.done();
  },
        
  "Analyse invoke a model with a wrong accessor": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.invoke(ast.expr.ident("A"),"y"),
          aModel = ast.model("A",
                             [],
                             [ast.param("x",ast.type.native("number"))]);
      test.ok(expression.analyse(list(), list(pair("A",aModel)), anExpression).isFailure(),              
              "Model invocation");
      test.done();
  },
        
  "Analyse pair": function (test) {
      test.expect(1);
      // Test
      var anExpression = ast.expr.pair(ast.expr.number(1), ast.expr.string("a"));
      test.deepEqual(expression.analyse(list("Pair"), list(), anExpression).success(),
                     pair(list(), ast.type.pair(ast.type.native("number"),ast.type.native("string"))),
                    "Pair (int,string)");
      test.done();
  },
};
