/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

/* QUICK AND DIRTY transpiler -- for validation purpose only */

module.exports = (function () {
    
    'use strict';
    
    var option   = require('../../Data/option.js'),
        aTry     = require('../../Data/atry.js'),
        list     = require('../../Data/list.js'),
        builder  = require('../checker/builder.js'),
        types    = require('../checker/types.js'),
        entities = require('../checker/entities.js'),
        ast      = require('../syntax/ast.js');

    function compileExpression(namespace, environment, variables, expression) {
        var result, newExpression;

        switch (expression.$type) {
            case 'NumberExpr':
                result = aTry.success("M.number(" + expression.value + ")");
                break;
            case 'StringExpr':
                result = aTry.success("M.string('" + expression.value + "')");
                break;
            case 'UnitExpr':
                result = aTry.success("M.unit");
                break;
            case 'IdentExpr':
                if (variables.contains(expression.value)) {
                    result = aTry.success("mvc$" + normalize(expression.value));
                } else if (namespace && namespace.length > 0) {
                    result = aTry.success("M.ident('" + expression.value + "', '"+ namespace.join(".") +"')");
                } else {
                    result = aTry.success("M.ident('" + expression.value + "')");
                }
                break;
            case 'InvokeExpr':
                result = compileExpression(namespace, environment, variables, expression.caller).map(function (caller) {
                    return "M.invoke(" + caller + ",'" + expression.name + "')";
                });
                break;
            case 'PairExpr':
                newExpression = ast.expr.application(ast.expr.application(ast.expr.ident("Pair"), expression.left),expression.right);
                result = compileExpression(namespace, environment, variables, newExpression);
                break;
            case 'ApplicationExpr':
                if (expression.argument.$type === 'IdentExpr' && 
                    !environment.contains(expression.argument.value) && 
                    !variables.contains(expression.argument.value)) {  
                    newExpression = ast.expr.invoke(expression.abstraction, expression.argument.value);                
                    result = compileExpression(namespace, environment, variables, newExpression);
                } else {
                    result = compileExpression(namespace, environment, variables, expression.abstraction).flatmap(function (abstraction) {
                        return compileExpression(namespace, environment, variables, expression.argument).map(function (argument) {
                            return "M.apply(" + abstraction + ",M.lazy(function(){return " + argument + ";}))";
                        });
                    });
                }                
                
                break;
            case 'ComprehensionExpr': // OK
                var iteration = expression.iterations[0],
                    iterations = expression.iterations.slice(1);

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
                
                result = compileExpression(namespace, environment, variables, newExpression);
                break;
            case 'TagExpr': 
                result = list(expression.attributes).foldL(aTry.success(list()),function (result, attribute) {
                    return result.flatmap(function (result) {
                        return compileExpression(namespace, environment, variables, attribute[1]).map(function (value) {
                            return result.add(["['" + attribute[0] +"',"+ value + "]"]);
                        });
                    });
                }).flatmap(function (attributes) {
                    return list(expression.body).foldL(aTry.success(list()),function (result,body) {
                        return result.flatmap(function (result) {
                            return compileExpression(namespace, environment,variables,body).map(function (body) {
                                return result.add(body);
                            });
                        });
                    }).map(function (body) {
                        return "M.tag('" + expression.name + "',["+ attributes.value.join(',') +"],["+body.value.join(',')+"])";
                    });
                });
                break;
            case 'LetExpr': // OK
                newExpression = ast.expr.application(ast.expr.abstraction(expression.name, 
                                                                          expression.body,
                                                                          expression.type),
                                                     expression.value);
                result = compileExpression(namespace, environment, variables, newExpression); 
                break;
            case 'AbstractionExpr': // OK
                result = compileExpression(namespace, environment, variables.add(expression.param), expression.body).map(function (body) {
                    return "function(mvc$" + normalize(expression.param) + "){return " + body + ";}";
                });
                break;
            default:
                result = aTry.failure(new Error("Cannot generate code for " + expression));
        }

        return result;
    }    
    
    function typeName(substitutions, aType) {
        switch (aType.$type) {
            case 'TypePolymorphic':
                return typeName(substitutions, aType.type);
            case 'TypeSpecialize':
                return typeName(substitutions, aType.type);                
            case 'TypeVariable':
                var newType = types.substitute(substitutions, aType);
                // Prevent infinite loop | return the variable name ...
                if (aType === newType) {
                    return option.some(aType.name);
                }
                return typeName(substitutions, newType);
            case 'TypeFunction':
                return option.none();
            case 'TypeNative':
            case 'Model':
            case 'Controller':                
            case 'View':
                return option.some(aType.name);
            case 'Typedef':
                return typeName(substitutions, aType.type);
            default:
                return option.none();
        }
    }
  
	//
	// Controller, View and Model compilation
	//
    
    function normalize(name) {
        return name.split('').map(function (c) {
            if (c >= 'a' && c <= 'z') {
                return c;
            } else if (c >= 'A' && c <= 'Z') {
                return c;
            } else if (c >= '0' && c <= '9') {
                return c;
            } else {
                return '_' + c.charCodeAt(0);
            }
            
        }).join('');
    }
	
    function compileController(environment, controller) {
        var substitutions = entities.substitutions(option.some(environment.value)),
            variables = environment.map(function (entity) { 
                return builder.entityName(entity); 
            }),
            result = list(controller.behaviors).foldL(aTry.success("'[id]':'"+ controller.name + "','[this]':mvc$" + normalize(controller.param.name)), function (result,behavior) {
				return result.flatmap(function(result) {
					return compileExpression([], variables, list('self',controller.param.name), behavior.definition).map(function (expression) {
						var callerName = option.some(behavior.caller).map(function (caller) {
							return typeName(substitutions, caller).map(function(name) {
								return name + '.';
							}).orElse("");
						}).orElse("");

						return result + ",'" + callerName + behavior.name + "':" + expression;                    
					});
				});
			});
        
        return result.map(function (result) {
            return "M.define('" + controller.name + "',function(mvc$" + normalize(controller.param.name) + "){return M.controller(function(mvc$self){return {" + result + "};})})";
        });
    }

    function compileView(environment, view) {
        var variables = environment.map(function (entity) { 
                return builder.entityName(entity); 
            }),
            result = aTry.success("'[id]':'"+ view.name + "','[this]':mvc$" + normalize(view.param.name)).flatmap(function (result) {
                return list(view.body).foldL(aTry.success(list()),function (result,body) {
                        return result.flatmap(function (result) {
                            return compileExpression([], variables, list('self',view.param.name), body).map(function (body) {
                                return result.add(body);
                            });
                        });
                    }).map(function (body) {
                        return result + ",'[render]':["+ body.value.join(',') + "]";
                    });
                });
        
        return result.map(function (result) {
            return "M.define('" + view.name + "',function(mvc$" + normalize(view.param.name) + "){return M.view(function(mvc$self){return {" + result + "};})})";
        });
    }
               
    function compileModel(model) {        
        var body = 
            list(model.params).foldL("'[id]':'" + model.name + "'", function (result,param) {
                return result + ",'" + param.name + "':mvc$" + normalize(param.name);
            });
        
        body = list(model.params).foldR(function (param, result) {
            return "function(mvc$" + normalize(param.name) + "){return " + result + ";}";
        }, "M.instance({" + body + "})");
        
        return aTry.success("M.define('" + model.name + "'," + body + ")");
    }
    
    function compileDefinition(environment, definition) {        
        var variables = environment.map(function (entity) {
                return builder.entityName(entity); 
            }),        
            body = compileExpression(['Core'], variables, list(), definition.expr);
        return body.map(function (body) {
            return "M.define('" + definition.name + "',M.lazy(function(){ return " + body + ";}))";
        });
    }

    function compileEntity(environment, entity) {
        switch (entity.$type) {
            case 'TypePolymorphic':
                return compileEntity(environment, entity.type);

            case 'Model':
                return compileModel(entity);
                
            case 'Controller':                
                return compileController(environment, entity);
                
            case 'View':
                return compileView(environment, entity);
                
            case 'Expression':
                return compileDefinition(environment, entity);
                
            case 'Typedef':
                return aTry.success(null);
        }
    }
    
    function compileSentence(environment, expression) {
        var variables = environment.map(function (entity) { 
            return builder.entityName(entity); 
        });

        return compileExpression([], variables,list(),expression).map(function(compiledCode) {
            // Eta-conversion - kinda
            return "(function(){return "+compiledCode+";}())";
        });
    }
    
    return {
        entity: compileEntity,
        expression: function (environment, variables, expression) { return compileExpression([], environment, variables, expression); },
        sentence: compileSentence
    };

}());