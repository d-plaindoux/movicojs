/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var error = require('../exception.js'),
        list = require('../../Data/list.js'),
        pair = require('../../Data/pair.js'),
        option = require('../../Data/option.js'),
        aTry = require('../../Data/atry.js'),
        ast  = require('../syntax/ast.js'),
        builder = require('../checker/builder.js'),
        types = require('../checker/types.js');
    
    function Expressions() {
        // Nothing for the moment
    }
        
    function getNative(substitutions, name) {
        var nativeType = substitute(substitutions, ast.type.variable(name));
        
        if (nativeType.$type === 'TypeVariable') {
            return ast.type.native(name);
        }
        
        return nativeType;
    }
        
    Expressions.prototype.native = function (substitutions, name) {
        return getNative(substitutions, name);
    };
    
    function substitute(substitutions, aType) {
        return types.substitute(substitutions, aType);
    }
    
    function unify(aType1, aType2) {
        return types.unify(aType1, aType2).map(function (result) {
            return aTry.success(result);
        }).recoverWith(aTry.failure(new Error("Cannot unify " + aType1 + " and " + aType2)));
    }

    function analyseIdentExpression(nongenerics, environment, substitutions, expression, type) {
        return environment.findFirst(function (binding) {
            return binding._1 === expression.value;                      
        }).map(function (binding) {
            var providedType = substitute(substitutions, binding._2);
            
            return unify(providedType, type).map(function (newSubstitutions) {
                return function () { 
                    return aTry.success(pair(newSubstitutions, substitute(newSubstitutions, type)));
                };
            }).recoverWith(function() {
                return builder.entityExpression(providedType).flatmap(function (expression) {
                    return unify(substitute(substitutions, expression), type).map(function (newSubstitutions) {
                        return aTry.success(pair(newSubstitutions, substitute(newSubstitutions, type)));
                    });
                }).recoverWith(aTry.failure(error(expression, "Cannot unify " + providedType + " and " + type)));
            })();
        }).orElse(aTry.failure(error(expression, "Unbound variable " + expression.value)));        
    }

    function retrieveCallerType(entity, name) {
        return types.reduce(entity).flatmap(function (entity) {
            switch (entity.$type) {
                case 'Typedef':
                    return retrieveCallerType(entity.type, name);
                    
                case 'TypeStructure':
                    return list(entity.params).findFirst(function (param) {
                        return param.name === name;
                    }).map(function (param) {
                        return aTry.success(param.type);
                    }).orElse(aTry.failure(error(entity, "Accessor '" + name + "' not found in " + entity)));

                case 'Model':
                    return list(entity.params).findFirst(function (param) {
                        return param.name === name;
                    }).map(function (param) {
                        return aTry.success(param.type);
                    }).orElse(aTry.failure(error(entity, "Accessor '" + name + "' not found in " + entity)));

                case 'Controller':                            
                    return list(entity.specifications).findFirst(function (behavior) {
                        return behavior.name === name;
                    }).map(function (behavior) {                        
                        return aTry.success(behavior.type);
                    }).orElse(aTry.failure(error(entity, "Accessor '" + name + "' not found in " + entity)));                     

                default: 
                    return aTry.failure(error(entity, "method " + name + " not found for " + entity));                            
            }        
        });
    }
    
    function analyseInvokeExpression(nongenerics, environment, substitutions, expression, type) {
        return analyseExpression(nongenerics, environment, substitutions, expression.caller, types.newVar()).flatmap(function (substitutionsAndEntity) {
            return retrieveCallerType(ast.relocate(substitute(substitutions, substitutionsAndEntity._2),expression), expression.name).flatmap(function (methodType) {
                return unify(substitute(substitutionsAndEntity._1, substitute(substitutions, methodType)), substitute(substitutionsAndEntity._1, type)).map(function (newSubstitutions) {
                    return pair(types.composeSubstitutions(newSubstitutions, substitutionsAndEntity._1), 
                                substitute(substitutionsAndEntity._1,substitute(newSubstitutions, type)));
                });
            });
        });  
    }
    
    function analysePairExpression(nongenerics, environment, substitutions, expression, type) {
        
        // (a,b) === Pair a b
        
        var newExpression = ast.relocate(ast.expr.application(ast.expr.application(ast.expr.ident("Pair"), expression.left),expression.right), expression);
        return analyseExpression(nongenerics, environment, substitutions, newExpression, type);    
    }
    
    function analyseApplicationExpression(nongenerics, environment, substitutions, expression, type) {
        var varArgument = types.newVar(),
            result = analyseExpression(nongenerics, environment, substitutions , expression.abstraction, ast.type.abstraction(varArgument, type)).flatmap(function (substitutionsAndAbstraction) {                
                var newVarArgument = substitute(substitutionsAndAbstraction._1, varArgument);
                return analyseExpression(nongenerics, environment, substitutions, expression.argument, newVarArgument).map(function (substitutionsAndArgument) {
                    var newSubstitutions = types.composeSubstitutions(substitutionsAndArgument._1, substitutionsAndAbstraction._1);
                    return pair(newSubstitutions, substitute(substitutionsAndAbstraction._1, substitute(substitutionsAndArgument._1, type)));
                });                    
            });
        
        if (result.isSuccess()) {
            return result;
        }

        // Invoke requires reverse type checking tactic so lets try it now !

        var result2 = analyseExpression(nongenerics, environment, substitutions, expression.argument, varArgument).flatmap(function (substitutionsAndArgument) {
            var newVarArgument =  substitute(substitutionsAndArgument._1, varArgument);
            return analyseExpression(nongenerics, environment, substitutions , expression.abstraction, ast.type.abstraction(newVarArgument, type)).map(function (substitutionsAndAbstraction) {                
                var newSubstitutions = types.composeSubstitutions(substitutionsAndAbstraction._1, substitutionsAndArgument._1);
                return pair(newSubstitutions, substitute(substitutionsAndArgument._1, substitute(substitutionsAndAbstraction._1, type)));
            });                    
        });
        
        if (result2.isSuccess()) {
            return result2;
        }
        
        return result;
    }
    
    function analyseComprehensionExpression(nongenerics, environment, substitutions, expression, type) {
        var iteration = expression.iterations[0],
            iterations = expression.iterations.splice(1),
            newExpression;
        
        // [ p for a in La for b in Lb if C1 ] === Lb.flatmap(fun b -> La.filter(a -> C1).map(a -> p))
        
        newExpression = list(expression.conditions).foldL(iteration[1], function(expression, condition) {
            return ast.expr.application(ast.expr.invoke(expression,"filter"),
                                        ast.expr.abstraction(iteration[0],condition));
        });
            
        newExpression = ast.expr.application(ast.expr.invoke(newExpression, "map"),
                                             ast.expr.abstraction(iteration[0], expression.value));
        
        newExpression = list(iterations).foldL(newExpression, function (expression, iteration) {
            return ast.expr.application(ast.expr.invoke(iteration[1], "flatmap"),
                                        ast.expr.abstraction(iteration[0], expression));
        });
        
        return analyseApplicationExpression(nongenerics, environment, substitutions, newExpression, type);
    }
    
    function analyseTagExpression(nongenerics, environment, substitutions, expression, type) {
        return list(expression.attributes).foldL(aTry.success(list()), function (newSubstitutions, attribute) {
            return newSubstitutions.flatmap(function (newSubstitutions) {
                var stringType = ast.relocate(getNative(substitutions, "string"), expression);
                return analyseExpression(nongenerics, environment, substitutions, attribute[1], stringType).map(function (substitutionsAndAttribute) {
                    return types.composeSubstitutions(types.composeSubstitutions(substitutionsAndAttribute._1, newSubstitutions), substitutions);
                });
            });
        }).flatmap(function (newSubstitutions) {
            return list(expression.body).foldL(aTry.success(newSubstitutions), function (newSubstitutions, body) {
                return newSubstitutions.flatmap(function (newSubstitutions) {
                    return analyseExpression(nongenerics, environment, substitutions, body, type).map(function (substitutionsAndBody) {
                        return types.composeSubstitutions(types.composeSubstitutions(newSubstitutions, substitutionsAndBody._1), substitutions);
                    });                            
                });
            }).map(function (newSubstitutions) {
                return pair(newSubstitutions, type);
            });
        });
    }

    function analyseLetExpression(nongenerics, environment, substitutions, expression, type) {
        var newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                      expression.body,
                                                                      expression.type),
                                                 expression.value);
        
        return analyseApplicationExpression(nongenerics, environment, substitutions, ast.relocate(newExpression, expression), type);
    }

    function analyseAbstractionExpression(nongenerics, environment, substitutions, expression, type) {
        var varArgument = substitute(substitutions, option.some(expression.type).orLazyElse(function () { return types.newVar(); })), 
            varResult = types.newVar();
        
        if (expression.type) {
            // Check unbound type variable
            var freeVariables = types.freeVariables(varArgument).minus(substitutions.map(function (substitution) { return substitution._1; }));
            
            if (!freeVariables.isEmpty()) {
                return aTry.failure(error(expression, "free variables: " + freeVariables.value.join(" ")));
            }
        }
        
        return unify(ast.type.abstraction(varArgument, varResult), type).flatmap(function (newSubstitutions) {            
            var newEnvironment = list(pair(expression.param, substitute(newSubstitutions, varArgument))).append(environment),
                newVarResult = substitute(substitutions, substitute(newSubstitutions, varResult));
            
            return analyseExpression(nongenerics, newEnvironment, substitutions, expression.body, newVarResult).map(function (substitutionsAndBody) {
                var allSubstitutions = types.composeSubstitutions(substitutionsAndBody._1, newSubstitutions);
                return pair(allSubstitutions, substitute(substitutionsAndBody._1, substitute(newSubstitutions, type)));
            });
        });
    }
    
    function analyseExpression(nongenerics, environment, substitutions, expression, type) {
        var result;
        
        switch (expression.$type) {
            case 'NumberExpr':            
                result = unify(getNative(substitutions, 'number'), type).map(function (newSubstitutions) {
                    return pair(newSubstitutions, getNative(substitutions, 'number'));
                });
                break;
            case 'StringExpr':
                result = unify(getNative(substitutions, 'string'), type).map(function (newSubstitutions) {
                    return pair(newSubstitutions, getNative(substitutions, 'string'));
                });
                break;
            case 'UnitExpr':
                var unitType = getNative(substitutions, 'unit');
                result = unify(unitType, type).map(function (newSubstitutions) {
                    return pair(newSubstitutions, getNative(substitutions, 'unit'));
                });
                break;
            case 'IdentExpr':
                result = analyseIdentExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'InvokeExpr':
                result = analyseInvokeExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'PairExpr': 
                result = analysePairExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'ApplicationExpr':
                if (expression.argument.$type === 'IdentExpr' && 
                    !environment.findFirst(function (binding) { return binding._1 === expression.argument.value;}).isPresent()) {  
                    var newExpression = ast.relocate(ast.expr.invoke(expression.abstraction, expression.argument.value),expression);                
                    result = analyseExpression(nongenerics, environment, substitutions, newExpression, type);
                } else {
                    result = analyseApplicationExpression(nongenerics, environment, substitutions, expression, type);
                }                                
                break;
            case 'ComprehensionExpr':
                result = analyseComprehensionExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'TagExpr': 
                var elementType = getNative(substitutions, "dom");
                result = unify(elementType, type).flatmap(function (newSubstitutions) {
                    return analyseTagExpression(nongenerics, environment, substitutions, expression, elementType).map(function () {
                        return pair(newSubstitutions, elementType);
                    });
                });
                break;
            case 'LetExpr':
                result = analyseLetExpression(nongenerics, environment, substitutions, expression, type);
                break;
            case 'AbstractionExpr':
                result = analyseAbstractionExpression(nongenerics, environment, substitutions, expression, type);
                break;
            default:
                result = aTry.failure(error(expression, "waiting for a " + expression.$type));
        }

        return result;
    }
    
    Expressions.prototype.analyse = function (nongenerics, environment, substitutions, expression, type) {
        return analyseExpression(nongenerics, environment, substitutions, expression, option.some(type).orElse(types.newVar()));
    };
    
    return new Expressions();
}());
    
    