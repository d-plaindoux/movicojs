'use strict';

var stream = require('../../src/Parser/stream.js').stream,
    rule = require('../../src/Parser/rule.js').rule,
    bind = require('../../src/Parser/bind.js').bind,
    optrep = require('../../src/Parser/optrep.js').optrep,
    rep = require('../../src/Parser/rep.js').rep,
    opt = require('../../src/Parser/opt.js').opt;

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

exports['rules'] = {
  setUp: function(done) {
    done();
  },
    
  'accept plain text rule': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("a"), 
        aRule = rule("a",function(a) { return a; });
    test.equal(aRule.apply(aStream).isPresent(), true, 'should be accepted.');
    test.done();
  },

  'reject plain text rule': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("a"), 
        aRule = rule("b",function(a) { return a; });
    test.equal(aRule.apply(aStream).isPresent(), false, 'should be rejected.');
    test.done();
  },
    
  'accept plain text rule and call the binded function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("aa"), 
        aRule = rule("a",function(a) { return a; });
    test.deepEqual(aRule.apply(aStream).get(), {}, 'should be accepted.');
    test.done();
  },
    
  'accept regexp rule': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("aa"), 
        aRule = rule(/a+/,function(a) { return a; });
    test.equal(aRule.apply(aStream).isPresent(), true, 'should be accepted.');
    test.done();
  },
    
  'accept regexp rule and call the binded function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("aa"), 
        aRule = rule(bind(/a+/).to("a"),function(a) { return a; });
    test.deepEqual(aRule.apply(aStream).get(), {a: "aa"}, 'should be accepted.');
    test.done();
  },

  'reject regexp rule': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("a"), 
        aRule = rule("b+",function(a) { return a; });
    test.equal(aRule.apply(aStream).isPresent(), false, 'should be rejected.');
    test.done();
  },
            
  'accept optional repeatable regexp rule and call the binded function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("aaa"), 
        aRule = rule(bind(optrep("a")).to("a"),function(a) { return a; });
    test.deepEqual(aRule.apply(aStream).get(), {a: ["a", "a", "a"]}, 'should be accepted.');
    test.done();
  },
            
  'accept repeatable regexp rule and call the binded function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("aaa"), 
        aRule = rule(bind(rep("a")).to("a"),function(a) { return a; });
    test.deepEqual(aRule.apply(aStream).get(), {a: ["a", "a", "a"]}, 'should be accepted.');
    test.done();
  },
            
  'accept optional regexp rule and call the binded function': function(test) {
    test.expect(1);
    // tests here  
    var aStream = stream("b"), 
        aRule = rule(bind(opt("a")).to("a"),function(a) { return a; });
    test.deepEqual(aRule.apply(aStream).get(), {a: []}, 'should be accepted.');
    test.done();
  },

};