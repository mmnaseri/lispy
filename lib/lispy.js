/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (5/28/15, 9:21 PM)
 */

(function () {

    function Reference(value) {
        this.value = value;
    }

    Reference.prototype.getValue = function () {
        return this.value;
    };

    var imports = {};

    var Basic = (function () {
        //noinspection JSUnusedGlobalSymbols
        var lang = {
            managers: {
                'libs+': function () {
                    return Utils.copy(arguments);
                }
            },
            environment: {
                print: function () {
                    Utils.each(Utils.copy(arguments), function (msg) {
                        console.log(msg);
                    });
                },
                error: function () {
                    Utils.each(Utils.copy(arguments), function (msg) {
                        console.error(msg);
                    });
                },
                warn: function () {
                    Utils.each(Utils.copy(arguments), function (msg) {
                        console.warn(msg);
                    });
                },
                libs: function () {
                    Utils.each(imports, function (value, name) {
                        this.print(name + (value.$$loaded ? " [loaded]" : "") + (value.description ? " - " + value.description : ""));
                    }, this);
                },
                'libs*': function () {
                    var result = [];
                    Utils.each(imports, function (value, name) {
                        result.push((value.$$loaded ? "+" : "-") + name);
                    }, this);
                    return result;
                },
                'libs+': function () {
                    Utils.each(Utils.copy(arguments), function (name) {
                        if (Utils.isDefined(imports[name])) {
                            lispy.load(name, imports[name]);
                            this.print('loaded: ' + name);
                        } else {
                            this.error("no such lib: " + name);
                        }
                    }, this);
                }
            }
        };
        lang.environment.print.$$definition = [['msg1', 'msg2', 'msg3', '*']];
        lang.environment.warn.$$definition = [['msg1', 'msg2', 'msg3', '*']];
        lang.environment.error.$$definition = [['msg1', 'msg2', 'msg3', '*']];
        lang.environment.libs.$$definition = [[]];
        lang.environment.libs.$$description = "Lists all available libraries";
        lang.environment['libs+'].$$definition = [['lib1', 'lib2', 'lib3', '*']];
        lang.environment['libs+'].$$description = "Loads specified libraries";
        lang.description = "Library related and basic commands";
        return lang;
    })();

    //noinspection JSUnusedGlobalSymbols
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

        var lang = {
            managers: {
                define: function (name, value) {
                    return [name, this.$value(this, value)];
                },
                label: copyArgs,
                lambda: copyArgs,
                cond: copyArgs,
                val: copyArgs,
                str: copyArgs,
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
                'not': function (value) {
                    if (value === true) {
                        return false;
                    } else if (value === false) {
                        return true;
                    } else {
                        throw "Expected a boolean value but got " + value;
                    }
                },
                'null?': function (value) {
                    return value === null || !Utils.isDefined(value) || (Utils.isArray(value) && value.length == 0);
                },
                'atom?': function (value) {
                    return value !== null && Utils.isDefined(value) && (!Utils.isArray(value) || value.length > 0);
                },
                str: function (msg) {
                    return msg;
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
                    if (!Utils.isDefined(name)) {
                        throw "Expected a name for the value";
                    }
                    if (!Utils.isDefined(value)) {
                        throw "Undefined value for " + name;
                    }
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
                    f.$$definition = Utils.copy(arguments);
                    return f;
                }
            }
        };
        lang.environment['+'].$$definition = [['a', 'b', 'c', '*']];
        lang.environment['-'].$$definition = [['a', 'b', 'c', '*']];
        lang.environment['*'].$$definition = [['a', 'b', 'c', '*']];
        lang.environment['/'].$$definition = [['a', 'b', 'c', '*']];
        lang.environment['='].$$definition = [['a', 'b']];
        lang.environment['!='].$$definition = [['a', 'b']];
        lang.environment['<'].$$definition = [['a', 'b']];
        lang.environment['>'].$$definition = [['a', 'b']];
        lang.environment['<='].$$definition = [['a', 'b']];
        lang.environment['>='].$$definition = [['a', 'b']];
        lang.environment['null?'].$$definition = [['a']];
        lang.environment['atom?'].$$definition = [['a']];
        lang.environment.not.$$definition = [['a']];
        lang.environment.str.$$definition = [['msg']];
        lang.environment.car.$$definition = [['list']];
        lang.environment.cdr.$$definition = [['list']];
        lang.environment.cond.$$definition = [['cond1', 'cond2', 'cond3', '*']];
        lang.environment.cons.$$definition = [['prefix', 'suffix']];
        lang.environment.define.$$definition = [['name', 'value']];
        lang.environment.label.$$definition = [['name', 'value']];
        lang.environment.lambda.$$definition = [['args', 'body1', 'body2', 'body3', '*']];
        lang.environment.let.$$definition = [['definitions', 'body1', 'body2', 'body3', '*']];
        lang.environment['+'].$$description = "Returns the summation of its input";
        lang.environment['-'].$$description = "Returns the difference of its input";
        lang.environment['*'].$$description = "Returns the multiplication of its input";
        lang.environment['/'].$$description = "Divides its inputs in successive order";
        lang.environment['='].$$description = "Returns true if its inputs are equal";
        lang.environment['!='].$$description = "Returns true if its inputs are unequal";
        lang.environment['<'].$$description = "Returns true if its inputs are arranged in strictly nondecreasing order";
        lang.environment['>'].$$description = "Returns true if its inputs are arranged in strictly decreasing order";
        lang.environment['<='].$$description = "Returns true if its inputs are arranged in nondecreasing order";
        lang.environment['>='].$$description = "Returns true if its inputs are arranged in decreasing order";
        lang.environment['null?'].$$description = "Returns true if its input is null";
        lang.environment['atom?'].$$description = "Returns true for an atom";
        lang.environment.not.$$description = "Negates the input condition";
        lang.environment.str.$$description = "Returns a string from its input values";
        lang.environment.car.$$description = "Returns the first element of the input list";
        lang.environment.cdr.$$description = "Returns everything but the first element of the input list";
        lang.environment.cond.$$description = "Sets up a condition. The condition consumes a list of binary tuples, in which\n" +
            "the first item is a boolean condition (or a lambda that can be resolved to a boolean condition) and the second\n" +
            "item is what will be resolved to the value of the conditional. As an example:\n" +
            "    (cond (T (+ 1 2)) (T 7))\n" +
            "will be resolved to `(+ 1 2)` which will then be resolved to `3`. Note that the first clause satisfying the\n" +
            "conditional will terminate the evaluation.";
        lang.environment.cons.$$description = "Will concatenate two lists together";
        lang.environment.define.$$description = "Defines a variable in the global scope and sets its value to the given\n" +
            "input. For instance:\n" +
            "    (define x 1)\n" +
            "will define variable `x` with value `1`. If we later write\n" +
            "    (define y (+ x 1))\n" +
            "we will be setting the value of `y` to `2`.";
        lang.environment.label.$$description = "This is the same as `define`, with the difference that the result will be\n" +
            "immediately forgotten. It is easier to think of this as a temporary name attached to a variable, whose scope\n" +
            "is only the `label` command itself. This can become useful, for instance, if we want to write a recursive\n" +
            "lambda that references itself. As an example, the following code will calculate the factorial of 10, without\n" +
            "modifying the global scope:\n" +
            "    ((label x (lambda (n) (cond ((> n 0) (* n (x (- n 1)))) (T 1)) )) 10)";
        lang.environment.lambda.$$description = "Will define a lambda. It takes its input in the following format:\n" +
            "    (lambda" +
            "       (list-of-arguments)\n" +
            "       (body-1)\n" +
            "       (body-2)\n" +
            "       ..." +
            "       (body-n)" +
            "    )\n" +
            "and will always evaluate to the value of last statement.";
        lang.environment.let.$$description = "`let` creates a local scope wherein you can demarcate your variables\n" +
            "into the local and the global scope:\n" +
            "    (define x 3)\n" +
            "    (let ((x 1) (y 2)) (+ x y))\n" +
            "will result in `3`, since in the bubble of the local scope created by `let`, variable `x` will have a\n" +
            "value of `1` and not `3`.\n" +
            "As in a lambda, `let` will be evaluated to the value of its latest statement.";
        lang.description = "Common LISP core commands";
        return lang;
    })();

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
        },
        toString: function (what, surroundString) {
            var src = "";
            var i;
            if (what === null) {
                return "(null)";
            } else if (Utils.isBoolean(what)) {
                return what ? "(true)" : "(false)";
            } else if (Utils.isFunction(what)) {
                if (what.$$definition) {
                    return "(lambda:" + Utils.toString(what.$$definition[0], surroundString) + ")";
                }
                return "(lambda)";
            } else if (Utils.isString(what)) {
                if (surroundString === true) {
                    return '"' + what + '"';
                }
                return what;
            } else if (Utils.isNumber(what)) {
                return "" + what;
            } else if (Utils.isArray(what)) {
                src += "[";
                for (i = 0; i < what.length; i++) {
                    if (i > 0) {
                        src += ", ";
                    }
                    src += Utils.toString(what[i], surroundString);
                }
                src += "]";
                return src;
            } else if (Utils.isObject(what)) {
                return JSON.stringify(what);
            } else {
                return "(unknown)";
            }
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
                Lispy.load('base', Basic);
                Lispy.load('lisp', CoreLisp);
                Lispy.register('base', Basic);
                Lispy.register('lisp', CoreLisp);
            },
            load: function (addonName, addon) {
                addon.$$loaded = true;
                Utils.each(addon['environment'] || {}, function (value, name) {
                    globals[name] = value;
                    if (Utils.isObject(value) || Utils.isFunction(value)) {
                        value.$$name = name;
                        value.$$origin = addonName;
                    }
                });
                Utils.each(addon['handlers'] || {}, function (handler, name) {
                    Lispy.handle(name, handler);
                });
                Utils.each(addon['managers'] || {}, function (manager, name) {
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
            },
            parse: function (text) {
                if (!text || typeof text != "string") {
                    return null;
                }
                var instruction = null;
                var stack = null;
                var cursor = 0;
                var open = 0;
                var token;
                var quote = 0;
                while (cursor < text.length) {
                    var current = text.charAt(cursor);
                    //skip the whitespace
                    if (/\s/.test(current)) {
                        cursor++;
                    } else if (current == '(') {
                        if (quote > 0) {
                            quote ++;
                        }
                        cursor++;
                        open++;
                        if (stack === null) {
                            //this is the first item in the current instruction
                            stack = [];
                            if (instruction == null) {
                                instruction = {};
                            }
                        }
                        //this is a new item in the current instruction
                        stack.push([]);
                    } else if (current == ')') {
                        cursor++;
                        if (open > 0) {
                            open--;
                            if (stack.length == 1) {
                                //we have seen the last of this instruction
                                break;
                            } else {
                                //we have to append this to the end of the last instruction
                                var value = stack.pop();
                                if (quote > 0) {
                                    quote --;
                                    if (quote == 1) {
                                        value.splice(0, 0, 'quote');
                                        quote = 0;
                                    }
                                }
                                stack[stack.length - 1].push(value);
                            }
                        } else {
                            //this is an error
                            throw "unexpected ')' at " + cursor + " in " + text.substring(cursor);
                        }
                    } else if (current == '"') {
                        token = "";
                        //skipping the '"'
                        cursor++;
                        while (cursor < text.length) {
                            if (text.charAt(cursor) == '"') {
                                cursor++;
                                break;
                            }
                            token += text.charAt(cursor++);
                        }
                        if (stack === null) {
                            instruction = {};
                            stack = [['str', token]];
                            break;
                        } else {
                            stack[stack.length - 1].push(['str', token]);
                        }
                    } else if (current == "'" && cursor < text.length - 1 && text[cursor + 1] == '(') {
                        quote = quote > 0 ? quote : 1;
                        cursor ++;
                    } else {
                        if (stack === null) {
                            //no lists are open, this is an error
                            throw "unexpected character (" + current + ") at " + cursor + " in " + text.substring(cursor);
                        } else {
                            token = "";
                            while (cursor < text.length && text.charAt(cursor) != '(' && text.charAt(cursor) != ')' && !/\s/.test(text.charAt(cursor))) {
                                token += text.charAt(cursor++);
                            }
                            if (/^[\+\-]?\d+(?:\.\d*)?$/.test(token)) {
                                token = parseFloat(token);
                            }
                            stack[stack.length - 1].push(token);
                        }
                    }
                }
                if (open != 0) {
                    throw "Unexpected number of open expressions at the end of parsing: " + open;
                }
                if (instruction != null) {
                    var result = stack.pop();
                    if (quote > 1) {
                        result.splice(0, 0, 'quote');
                    }
                    instruction.current = function () {
                        return Utils.copy(result);
                    };
                    instruction.next = function () {
                        return Lispy.parse(text.substring(cursor));
                    };
                }
                return instruction;
            },
            execute: function (text, addon) {
                var result = [];
                var instruction = Lispy.parse(text);
                while (instruction != null) {
                    result.push(Lispy.interpret(Object.create(globals), instruction.current(), addon));
                    instruction = instruction.next();
                }
                return result;
            }
        };
        return Lispy;
    };
    var lispy = factory();
    lispy.reset();
    var Lispy = {
        manage: function (fn, manager) {
            return lispy.manage.apply(lispy, arguments);
        },
        handle: function (fn, handler) {
            return lispy.handle.apply(lispy, arguments);
        },
        reset: function () {
            lispy.reset();
        },
        load: function (name, addon) {
            lispy.load(name, addon);
        },
        interpret: function (list, addon) {
            var env = {};
            Utils.each(globals, function (value, name) {
                env[name] = value;
            });
            return lispy.interpret.apply(lispy, [env, list, addon]);
        },
        register: function (name, library) {
            lispy.register(name, library);
        },
        parse: function (text) {
            return lispy.parse(text);
        },
        execute: function (text, addon) {
            return lispy.execute(text, addon);
        },
        utils: function () {
            return Utils;
        },
        env: function () {
            var env = {};
            Utils.each(globals, function (value, name) {
                env[name] = value;
            });
            return env;
        }
    };

    if (typeof define === "function" && define.amd) {
        /**
         * Registering Lispy as an AMD module if possible.
         */
        define('lispy', [], function () {
            return Lispy;
        });
    } else {
        /**
         * If not, we will expose it via window
         */
        window.Lispy = Lispy;
        function attach(what) {
            load[what] = true;
            if (load.window && load.document) {
                var scripts = document.getElementsByTagName("script");
                document.removeEventListener("DOMContentLoaded", load.handlers.document);
                window.removeEventListener("load", load.handlers.window);
                for (var i = 0; i < scripts.length; i ++) {
                    var script = scripts[i];
                    if (script.getAttribute('type') == 'text/lisp') {
                        var text = script.innerHTML.replace(/^\s*<!--/, "").replace(/-->\s*$/, "");
                        Lispy.execute(text);
                    }
                }
            }
        }
        var load = {
            window: false,
            document: true,
            handlers: {
                window: attach.bind(null, 'window'),
                document: attach.bind(null, 'document')
            }
        };
        document.addEventListener("DOMContentLoaded", load.handlers.document);
        window.addEventListener("load", load.handlers.window);
    }

})();
