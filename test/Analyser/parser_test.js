'use strict';

var stream = require('../../src/Analyser/stream.js');
var parser = require('../../src/Analyser/parser.js');

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

exports['parsers'] = {
  setUp: function(done) {
    done();
  },
    
  'skip empty characters from an empty stream': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream.stream(""), 
        aParser = parser.parser();
      
    aParser.addSkip(/\s+/);      
    aParser.skip(aStream);
      
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },

  'skip empty characters from an stream with spaces only': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream.stream(" \t\n"), 
        aParser = parser.parser();
      
    aParser.addSkip(/\s+/);            
    aParser.skip(aStream);
      
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },

  'skip empty characters from an stream with spaces and more': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream.stream(" \t\nIdent"), 
        aParser = parser.parser();
      
    aParser.addSkip(/\s+/);      
    aParser.addRule(/[a-zA-Z]+/,function(ident) { return ident; });      
      
    aParser.step(aStream);
      
    test.equal(aStream.isEmpty(), true, 'should be empty.');
    test.done();
  },

  'skip empty characters from an stream with spaces and ident': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream.stream(" \t\nIdent"), 
        aParser = parser.parser();
      
    aParser.addSkip(/\s+/);      
    aParser.addRule(/[a-zA-Z]+/,function(ident) { return ident; });      
            
    test.equal(aParser.step(aStream).orElse(null), "Ident", 'should be an ident.');
    test.done();
  },};