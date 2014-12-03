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
    test.(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['language_object'] = {
  setUp: function(done) {
    done();
  },
    
  'simple model is accepted': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("object Address {}");
        
    test.ok(language.parser.group('modelDef').parse(aStream).isPresent(), 
            "accept a model");
    test.done();
  },
        
  'not well formed model is rejected': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("object Address { address } ");
        
    test.equal(language.parser.group('modelDef').parse(aStream).isPresent(), 
               false , "reject a model");
    test.done();
  },
        
  'simple model is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("object Address {}");
        
    test.deepEqual(language.parser.group('modelDef').parse(aStream).get(), 
                   ast.model('Address', []) , "accept a model");
    test.done();
  },
        
  'complexe model is accepted and provided': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("object Address { street : string number : int}");        
    test.deepEqual(language.parser.group('modelDef').parse(aStream).get(), 
                   ast.model('Address', [ast.param('street',ast.type.native('string')), ast.param('number',ast.type.native('int'))]) , "accept a model");
    test.done();
  },

};