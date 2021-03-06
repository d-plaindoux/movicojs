'use strict';

var stream = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/stream.js'),
    parser = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/parser.js'),
    bind = require('../../lib' + (process.env.THICKET_COV || '') + '/Parser/bind.js');

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

exports['parser'] = {
  setUp: function(done) {
    done();
  },
    
  'skip empty characters from an empty stream': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream(""), 
        aParser = parser();
      
    aParser.addSkip(/^\s+/);      
    aParser.skip(aStream);
      
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },

  'skip empty characters from an stream with spaces only': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream(" \t\n"), 
        aParser = parser();
      
    aParser.addSkip(/^\s+/);            
    aParser.skip(aStream);
      
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },

  'skip empty characters from an stream with spaces and more': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream(" \t\nIdent"), 
        aParser = parser();
      
    aParser.addSkip(/^\s+/);      
    aParser.group("test").addRule(/^[a-zA-Z]+/,function(ident) { return ident; });      
      
    aParser.group("test").parse(aStream);
      
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },

  'skip empty characters from an stream with spaces and ident': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream(" \t\nIdent"), 
        aParser = parser(),
        aGroup = aParser.group("test");
      
    aParser.addSkip(/^\s+/);      
    aGroup.addRule(/^[a-zA-Z]+/,function(ident) { return ident; });      
            
    test.deepEqual(aGroup.parse(aStream).orElse(null), {}, 'should be an ident.');
    test.done();
  },

  'should accept an ident': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream(" \t\nIdent"), 
        aGroup = parser().group("test");
      
    aGroup.addRule([/\s+/, /[a-zA-Z]+/], function(ident) { return ident; });      
            
    test.deepEqual(aGroup.parse(aStream).orElse(null), {}, 'should be an ident.');
    test.done();
  },
    
  'should accept and return an ident': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream(" \t\nIdent"), 
        aParser = parser(),
        aGroup = aParser.group("test");
      
    aParser.addSkip(/^\s+/);      
    aGroup.addRule([bind(/^[a-zA-Z]+/).to('a')], function(scope) { return scope['a']; });      
            
    test.deepEqual(aGroup.parse(aStream).orElse(null), "Ident", 'should be an ident.');
    test.done();
  },    

  'should accept and return an ident in parenthesis': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("( Ident )"), 
        aParser = parser(),
        aGroup = aParser.group("test");
      
    aParser.addSkip(/^\s+/);      
    aGroup.addRule(["(", bind(/^[a-zA-Z]+/).to('a'), ")"], function(scope) { return scope['a']; });      
            
    test.deepEqual(aGroup.parse(aStream).orElse(null), "Ident", 'should be an ident.');
    test.done();
  },    
};
