/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

'use strict';

exports.movicoc = (function() {
    var stream = require('../Parser/stream.js').stream,
        option = require('../Data/option.js').option,
        aTry = require('../Data/atry.js').atry,
        list = require('../Data/list.js').list,
        language = require('../Movico/language.js').language(),
        entities = require('../Movico/entities.js').entities,
        expressions = require('../Movico/expressions.js').expressions,
        compiler = require('../Movico/compiler.js').compiler;

    function compileEntities(definedEntities, data) {
        var aStream = stream(data),
            newEntities = language.parser.group('entities').parse(aStream),
            allEntities = option.some(definedEntities.concat(newEntities.orElse([]))),
            nongenerics = entities.nongenerics(allEntities),
            patternNongenerics = entities.patternNongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            patternSubstitutions = entities.patternSubstitutions(allEntities),
            environment = entities.environment(allEntities);

        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure(new Error("#syntax error " + aStream.location()));
        }

        var freeVariables = list(newEntities.orElse([])).foldL(list(), function (result, entity) {
            return result.append(entities.freeVariables(patternNongenerics, entity));
        }).minus(nongenerics);

        // Free variables must be tracked
        if (!freeVariables.isEmpty()) {
            return aTry.failure(new Error('found free variables '  + freeVariables.value.join(', ')));
        }

        return list(newEntities.orElse([])).foldL(aTry.success(list()), function (result, entity) {
            return result.flatmap(function (result) {
                return entities.analyse(environment, substitutions, patternSubstitutions, entity).map(function () {
                    return null;
                }).flatmap(function() {
                    return compiler.entity(list(allEntities.get()), entity).map(function(compiledCode) {
                        return result.add([entity, compiledCode]);
                    });
                });
            });
        });
    }

    function compileSentence(definedEntities, data) {
        var aStream = stream(data),
            variables = list(definedEntities).map(function (entity) {
                return entities.entityName(entity);
            }),
            expression = language.parser.group('sentence').parse(aStream);

        // Buffer must be consumed
        if (!aStream.isEmpty()) {
            return aTry.failure([false,new Error("#syntax error " + aStream.location())]);
        }

        var allEntities = option.some(definedEntities),
            nongenerics = entities.nongenerics(allEntities),
            substitutions = entities.substitutions(allEntities),
            environment = entities.environment(allEntities),
            type = expressions.analyse(nongenerics, environment, substitutions, expression.get());

        if (type.isFailure()) {
            return aTry.failure([true,type.failure()]);
        } 

        return compiler.sentence(variables,expression.get()).map(function(compiledCode) {            
            return [type.success()._2, compiledCode];
        });
    }
    
    return { 
        entities: compileEntities,
        sentence: compileSentence
    };

}());