/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (5/28/15, 9:21 PM)
 */

(function (context) {

    var binaryOp = function (op) {
        return function () {
            var value = 0;
            for (var i = 0; i < arguments.length; i ++) {
                if (!Utils.isNumber(arguments[i])) {
                    return null;
                }
                value = eval("(function(a, b) { return a " + op + " b; })")(value, arguments[i]);
            }
            return value;
        };
    };

    var comparison = function (op) {
        return eval("(function (a, b) { return a " + op + " b ;})");
    };

    //noinspection JSPrimitiveTypeWrapperUsage,JSUnusedGlobalSymbols
    var environment = {
        T: true,
        F: false,
        val: function (name) {
            if (arguments.length == 1) {
                return this[name];
            }
            return Utils.each(Utils.copy(arguments), function (value) {
                if (!Utils.isString(value)) {
                    return null;
                } else {
                    return this[value];
                }
            }, this);
        },
        quote: function () {
            if (arguments.length == 0) {
                return null;
            }
            return Utils.copy(arguments);
        },
        car: function (list) {
            if (!Utils.isArray(list) || list.length == 0) {
                return null;
            }
            return list[0];
        },
        cdr: function (list) {
            if (!Utils.isArray(list) || list.length < 2) {
                return null;
            }
            var result = [];
            Utils.each(list, function (value, index) {
                if (index > 0) {
                    result.push(value);
                }
            });
            return result;
        },
        cons: function (first, second) {
            if (!Utils.isArray(first) || !Utils.isArray(second)) {
                return null;
            }
            var result = [];
            var copier = function (value) {
                result.push(value);
            };
            Utils.each(first, copier);
            Utils.each(second, copier);
            return result;
        },
        define: function (name, value) {
            environment[name] = value;
            return value;
        },
        'let': function () {
            if (arguments.length < 2) {
                return null;
            }
            var vars = arguments[0];
            if (!Utils.isArray(vars)) {
                return null;
            }
            var addon = {};
            Utils.each(vars, function (value) {
                if (Utils.isArray(value) && value.length >= 2) {
                    if (Utils.isString(value[1])) {
                        addon[value[0]] = this[value[1]];
                    } else if (Utils.isArray(value[1])) {
                        addon[value[0]] = this.$interpret(this, value[1]);
                    }
                } else if (Utils.isString(value)) {
                    addon[value] = null;
                }
            }, this);
            var statements = Utils.copy(arguments).splice(0, 1);
            statements = Utils.each(statements, function (statement) {
                return this.$interpret(this, statement, addon);
            }, this);
            return statements[statements.length - 1];
        },
        cond: function () {
            var conditions = Utils.copy(arguments);
            for (var i = 0; i < conditions.length; i ++) {
                if (!Utils.isArray(conditions[i]) || conditions[i].length == 0) {
                    continue;
                }
                var clause = conditions[i];
                var value = this.$value(this, clause[0]);
                if (!Utils.isBoolean(value) || !value) {
                    continue;
                }
                if (clause.length == 1) {
                    return value;
                }
                var result = Utils.each(clause, function (expression, index) {
                    if (index == 0) {
                        return null;
                    }
                    return this.$value(this, expression);
                }, this);
                result.splice(0, 1);
                if (result.length == 1) {
                    return result[0];
                }
                return result;
            }
            return null;
        },
        lambda: function () {
            if (arguments.length == 0) {
                return null;
            }
            var args = arguments[0];
            var statements = [];
            for (var i = 1; i < arguments.length; i ++) {
                statements.push(arguments[i]);
            }
            return function () {
                var i;
                var environment = Object.create(this);
                for (i = 0; i < args.length; i ++) {
                    if (!Utils.isString(args[i]) || i >= arguments.length) {
                        continue;
                    }
                    environment[args[i]] = arguments[i];
                }
                var result = null;
                for (i = 0; i < statements.length; i ++) {
                    result = this.$value(this, statements[i]);
                }
                return result;
            }
        },
        '+': binaryOp('+'),
        '-': binaryOp('-'),
        '*': binaryOp('*'),
        '/': binaryOp('/'),
        '=': comparison('=='),
        '!=': comparison('!='),
        '<': comparison('<'),
        '>': comparison('>'),
        '<=': comparison('<='),
        '>=': comparison('>=')
    };
    var globals = {};
    var Utils = {
        isArray: function (obj) {
            return Array.isArray(obj);
        },
        isFunction: function (obj) {
            return obj instanceof Function;
        },
        isString: function (obj) {
            return typeof obj == "string";
        },
        isDefined: function (obj) {
            return typeof obj != "undefined";
        },
        isObject: function (obj) {
            return !Utils.isArray(obj) && typeof obj == "object";
        },
        isBoolean: function (obj) {
            return typeof obj == "boolean";
        },
        isNumber: function (obj) {
            return typeof obj == "number";
        },
        copy: function (array) {
            var result = [];
            for (var i = 0; i < array.length; i ++) {
                result.push(array[i]);
            }
            return result;
        },
        each: function (iteratee, iterator, context) {
            var result;
            context = context || this;
            if (Utils.isArray(iteratee)) {
                result = [];
                for (var i = 0; i < iteratee.length; i ++) {
                    result.push(iterator.apply(context, [iteratee[i], i]));
                }
            } else if (Utils.isObject(iteratee)) {
                result = {};
                for (var key in iteratee) {
                    if (iteratee.hasOwnProperty(key)) {
                        result[key] = iterator.apply(context, [iteratee[key], key]);
                    }
                }
            }
            return result;
        }
    };
    var factory = function () {
        var Controller = (function () {
            var remembered = {};
            return {
                remember: function (obj) {
                    remembered[obj] = {};
                    Utils.each(eval(obj), function (value, name) {
                        remembered[obj][name] = value;
                    });
                },
                clean: function (obj) {
                    eval("(function () {" + obj + " = {};})()");
                    var target = eval(obj);
                    Utils.each(remembered[obj] || {}, function (value, name) {
                        target[name] = value;
                    });
                }
            };
        })();
        var handlers = {
        };
        var managers = {
            define: function (name, value) {
                return [name, this.$value(this, value)];
            },
            lambda: function (args, body, _) {
                return Utils.copy(arguments);
            },
            cond: function () {
                return Utils.copy(arguments);
            },
            val: function () {
                return Utils.copy(arguments);
            }
        };
        Controller.remember("environment");
        Controller.remember("managers");
        Controller.remember("handlers");
        var Lispy = {
            reset: function () {
                Controller.clean("handlers");
                Controller.clean("managers");
                Controller.clean("environment");
                globals = {};
            },
            load: function (addon) {
                Utils.each(addon, function (value, name) {
                    globals[name] = value;
                });
            },
            handle: function (fn, handler) {
                if (!Utils.isString(fn)) {
                    throw "Expected function name is missing in handler";
                }
                if (!Utils.isFunction(handler)) {
                    throw "Handler must be a function for " + fn;
                }
                handlers[fn] = handler;
            },
            manage: function (fn, manager) {
                if (!Utils.isString(fn)) {
                    throw "Expected function name is missing in manager";
                }
                if (!Utils.isFunction(manager)) {
                    throw "Manager must be a function for " + fn;
                }
                managers[fn] = manager;
            },
            interpret: function (environment, list, addon) {
                if (!list || !Utils.isArray(list) || !list.length) {
                    return null;
                }
                environment = Object.create(environment);
                environment.$interpret = function (environment, list, addon) {
                    return Lispy.interpret(environment, list, addon);
                };
                environment.$value = function (environment, value) {
                    if (Utils.isString(value)) {
                        return environment[value];
                    } else if (Utils.isArray(value)) {
                        return environment.$interpret(environment, value);
                    } else {
                        return value;
                    }
                };
                if (Utils.isObject(addon)) {
                    Utils.each(addon, function (value, property) {
                        environment[property] = Utils.isDefined(environment[property]) ? environment[property] : value;
                    });
                }
                var fn = list[0];
                if (Utils.isString(fn) || Utils.isFunction(fn)) {
                    var args = [];
                    Utils.each(list, function (arg, i) {
                        if (i > 0) {
                            args.push(arg);
                        }
                    });
                    if (Utils.isString(fn)) {
                        if (Utils.isDefined(managers[fn] && Utils.isFunction(managers[fn]))) {
                            args = managers[fn].apply(environment, args);
                            if (!Utils.isArray(args)) {
                                throw "Managed arguments must be an array for " + fn;
                            }
                        } else {
                            args = Utils.each(args, function (value) {
                                if (Utils.isArray(value)) {
                                    return Lispy.interpret(environment, value);
                                } else if (Utils.isString(value)) {
                                    return environment[value];
                                } else {
                                    return value;
                                }
                            });
                        }
                        if (Utils.isDefined(handlers[fn]) && Utils.isFunction(handlers[fn])) {
                            return handlers[fn].apply(environment, args);
                        }
                    }
                    if (Utils.isString(fn)) {
                        fn = environment[fn];
                    }
                    if (Utils.isFunction(fn)) {
                        return fn.apply(environment, args);
                    } else {
                        throw "Expected a function but got " + fn;
                    }
                } else {
                    return list;
                }
            }
        };
        return Lispy;
    };
    var lispy = factory();
    context.Lispy = {
        manage: function (fn, manager) {
            return lispy.manage.apply(lispy, arguments);
        },
        handle: function (fn, handler) {
            return lispy.handle.apply(lispy, arguments);
        },
        reset: function () {
            lispy.reset();
        },
        load: function (addon) {
            lispy.load(addon);
        },
        interpret: function (list, addon) {
            var env = Object.create(environment);
            Utils.each(addon, function (value, name) {
                env[name] = value;
            });
            return lispy.interpret.apply(lispy, [env, list, addon]);
        }
    };
})(window);
