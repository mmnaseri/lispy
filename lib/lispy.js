/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (5/28/15, 9:21 PM)
 */

(function (context) {

    function Reference(value) {
        this.value = value;
    }

    Reference.prototype.getValue = function () {
        return this.value;
    };

    var imports = {};

    var Basic = (function () {
        return {
            environment: {
                print: function () {
                    Utils.each(Utils.copy(arguments), function (msg) {
                        console.log(msg);
                    });
                },
                libs: function () {
                    Utils.each(imports, function (value, name) {
                        this.print(name);
                    }, this);
                },
                'libs-load': function (name) {
                    if (Utils.isDefined(imports[name])) {
                        lispy.load(imports[name]);
                    } else {
                        this.print('no such lib: ' + name);
                    }
                }
            }
        };
    })();

    var CoreLisp = (function () {

        var binaryOp = function (op) {
            return function () {
                var value = null;
                for (var i = 0; i < arguments.length; i++) {
                    var item = parseFloat(arguments[i]);
                    if (!Utils.isNumber(item)) {
                        return null;
                    }
                    if (value === null) {
                        value = item;
                    } else {
                        value = eval("(function(a, b) { return a " + op + " b; })")(value, item);
                    }
                }
                return value;
            };
        };

        var comparison = function (op) {
            return eval("(function (a, b) { return a " + op + " b ;})");
        };

        var copyArgs = function () {
            return Utils.copy(arguments);
        };

        return {
            managers: {
                define: function (name, value) {
                    return [name, this.$value(this, value)];
                },
                label: copyArgs,
                lambda: copyArgs,
                cond: copyArgs,
                val: copyArgs,
                let: copyArgs,
                quote: copyArgs
            },
            environment: {
                T: true,
                F: false,
                '+': binaryOp('+'),
                '-': binaryOp('-'),
                '*': binaryOp('*'),
                '/': binaryOp('/'),
                '=': comparison('=='),
                '!=': comparison('!='),
                '<': comparison('<'),
                '>': comparison('>'),
                '<=': comparison('<='),
                '>=': comparison('>='),
                'null?': function (value) {
                    return value === null || !Utils.isDefined(value) || (Utils.isArray(value) && value.length == 0);
                },
                'atom?': function (value) {
                    return value !== null && Utils.isDefined(value) && (!Utils.isArray(value) || value.length > 0);
                },
                val: function (name) {
                    if (arguments.length == 1) {
                        return Utils.isDefined(this[name]) ? this[name] : null;
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
                    if (!Utils.isArray(first)) {
                        if (typeof first == "undefined" || first === null) {
                            first = [];
                        } else {
                            first = [first];
                        }
                    }
                    if (!Utils.isArray(second)) {
                        if (typeof second == "undefined" || second === null) {
                            second = [];
                        } else {
                            second = [second];
                        }
                    }
                    var result = [];
                    var copier = function (value) {
                        result.push(value);
                    };
                    Utils.each(first, copier);
                    Utils.each(second, copier);
                    if (result.length == 0) {
                        return null;
                    }
                    return result;
                },
                define: function (name, value) {
                    globals[name] = value;
                    return value;
                },
                label: function (name, value) {
                    var env = this;
                    env[name] = new Reference(value);
                    var result = env.$value(env, value);
                    if (result.$$lambda === true) {
                        result = result.bind(env);
                    }
                    return result;
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
                        if (Utils.isArray(value) && value.length > 1 && Utils.isString(value[0])) {
                            addon[value[0]] = this.$value(this, value[1]);
                        } else if (Utils.isString(value)) {
                            addon[value] = null;
                        }
                    }, this);
                    var statements = Utils.copy(arguments).splice(1);
                    var environment = Object.create(this);
                    Utils.each(addon, function (value, name) {
                        environment[name] = value;
                    });
                    statements = Utils.each(statements, function (statement) {
                        return this.$interpret(environment, statement);
                    }, this);
                    return statements[statements.length - 1];
                },
                cond: function () {
                    var conditions = Utils.copy(arguments);
                    for (var i = 0; i < conditions.length; i++) {
                        if (!Utils.isArray(conditions[i]) || conditions[i].length == 0) {
                            continue;
                        }
                        var clause = conditions[i];
                        var value = this.$value(this, clause[0]);
                        if (!Utils.isBoolean(value)) {
                            return null;
                        } else if (!value) {
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
                        }, this).splice(1);
                        if (result.length == 1) {
                            return result[0];
                        }
                        return result;
                    }
                    return null;
                },
                lambda: function () {
                    if (arguments.length < 2) {
                        return null;
                    }
                    var args = arguments[0];
                    var statements = Utils.copy(arguments).splice(1);
                    var context = this;
                    var f = function () {
                        var currentContext = this && this.window != window ? this : context;
                        var i;
                        var environment = Object.create(currentContext);
                        for (i = 0; i < args.length; i++) {
                            if (!Utils.isString(args[i]) || i >= arguments.length) {
                                continue;
                            }
                            environment[args[i]] = arguments[i];
                        }
                        var result = null;
                        for (i = 0; i < statements.length; i++) {
                            result = currentContext.$value(environment, statements[i]);
                        }
                        return result;
                    };
                    f.$$lambda = true;
                    return f;
                }
            }
        };
    })();

    var environment = {};
    var globals = {};
    var Utils = {
        isArray: function (obj) {
            return Array.isArray(obj);
        },
        isFunction: function (obj) {
            return obj instanceof Function;
        },
        isReference: function (obj) {
            return obj instanceof Reference;
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
            for (var i = 0; i < array.length; i++) {
                result.push(array[i]);
            }
            return result;
        },
        each: function (iteratee, iterator, context) {
            var result;
            context = context || this;
            if (Utils.isArray(iteratee)) {
                result = [];
                for (var i = 0; i < iteratee.length; i++) {
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
        var handlers = {};
        var managers = {};
        var Lispy = {
            reset: function () {
                imports = {};
                globals = {};
                handlers = {};
                managers = {};
                environment = {};
                Lispy.load(Basic);
                Lispy.load(CoreLisp);
                Lispy.register('base', Basic);
                Lispy.register('lisp', CoreLisp);
            },
            load: function (addon) {
                Utils.each(addon.environment || {}, function (value, name) {
                    globals[name] = value;
                });
                Utils.each(addon.handlers || {}, function (handler, name) {
                    Lispy.handle(name, handler);
                });
                Utils.each(addon.managers || {}, function (manager, name) {
                    Lispy.manage(name, manager);
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
            register: function (name, library) {
                if (Utils.isDefined(imports[name])) {
                    throw "already registered: " + name;
                }
                imports[name] = library;
            },
            interpret: function (environment, list, addon) {
                if (!list || !Utils.isArray(list) || !list.length) {
                    return null;
                }
                environment = Object.create(environment);
                if (!environment.$interpret) {
                    environment.$interpret = function (environment, list, addon) {
                        return Lispy.interpret(environment, list, addon);
                    };
                }
                if (!environment.$value) {
                    environment.$value = function (environment, value) {
                        if (Utils.isString(value)) {
                            return environment[value];
                        } else if (Utils.isArray(value)) {
                            return environment.$interpret(environment, value);
                        } else {
                            return value;
                        }
                    };
                }
                if (Utils.isObject(addon)) {
                    Utils.each(addon, function (value, property) {
                        environment[property] = Utils.isDefined(environment[property]) ? environment[property] : value;
                    });
                }
                var fn = list[0];
                if (Utils.isString(fn) || Utils.isReference(fn) || Utils.isFunction(fn) || Utils.isArray(fn)) {
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
                            args = Utils.each(args, environment.$value.bind(null, environment));
                        }
                        if (Utils.isDefined(handlers[fn]) && Utils.isFunction(handlers[fn])) {
                            return handlers[fn].apply(environment, args);
                        }
                    }
                    if (Utils.isString(fn)) {
                        fn = environment[fn];
                    } else if (Utils.isArray(fn)) {
                        fn = environment.$interpret(environment, fn, addon);
                    }
                    if (Utils.isReference(fn)) {
                        fn = environment.$interpret(environment, fn.getValue(), addon);
                    }
                    if (Utils.isFunction(fn)) {
                        return fn.apply(environment, args);
                    } else {
                        throw "Expected a function but got " + fn + " in " + list;
                    }
                } else {
                    return list;
                }
            }
        };
        return Lispy;
    };
    var lispy = factory();
    lispy.reset();
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
            Utils.each(globals, function (value, name) {
                env[name] = value;
            });
            return lispy.interpret.apply(lispy, [env, list, addon]);
        },
        register: function (name, library) {
            lispy.register(name, library);
        }
    };
    window.env1 = environment;
})(window);
