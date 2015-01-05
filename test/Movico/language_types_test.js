'use strict';

var stream = require('../../lib' + (process.env.MOVICO_COV || '') + '/Parser/stream.js').stream,
    language = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/language.js').language(),
    ast = require('../../lib' + (process.env.MOVICO_COV || '') + '/Movico/ast.js').ast;

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
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['language_type'] = {
  setUp: function(done) {
    done();
  },
    
  'simple named type is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("number");
        
    test.deepEqual(language.parser.group('type').parse(aStream).orElse(null), 
                   ast.type.native('number'),
                   "accept number type");
    test.done();
  },
    
  'simple named type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( number )");
        
    test.deepEqual(language.parser.group('type').parse(aStream).orElse(null), 
                   ast.type.native('number'),
                   "accept number type");
    test.done();
  },
    
  'simple named type witch open parenthesis is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( number ");
        
    test.equal(language.parser.group('type').parse(aStream).isPresent(), false, "reject (number)type");
    test.done();
  },
    
  'simple named list type is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(List[number])");
        
    test.deepEqual(language.parser.group('type').parse(aStream).orElse(null),
                   ast.type.list(ast.type.native('number')),
                   "accept [number] type");
    test.done();
  },
    
  'simple named unclosed list type is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("[number");
        
    test.equal(language.parser.group('type').parse(aStream).isPresent(), false, "reject [number type");
    test.done();
  },
    
  'tuple type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( number, string )");
        
    test.deepEqual(language.parser.group('type').parse(aStream).orElse(null), 
                   ast.type.pair(ast.type.native('number'),ast.type.native('string')),
                   "accept (number,string) type");
    test.done();
  },    
        
  'function type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( number -> string )");
        
    test.deepEqual(language.parser.group('type').parse(aStream).orElse(null), 
                   ast.type.abstraction(ast.type.native('number'),ast.type.native('string')),
                   "accept (number->string) type");
    test.done();
  },    

    'list of tuple type (in parenthesis) is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("(List[(number,string)])");
        
    test.deepEqual(language.parser.group('type').parse(aStream).orElse(null), 
                   ast.type.list(ast.type.pair(ast.type.native('number'),ast.type.native('string'))), 
                   "accept [(number,string)] type");
    test.done();
  },    
};