/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/2/15, 12:38 PM)
 */
(function () {

    var factory = function (Lispy) {
        var Utils = Lispy.utils();
        var lib = {
            managers: {
                object: function () {
                    return Utils.copy(arguments);
                },
                get: function (context, property) {
                    return [this.$value(this, context), property];
                },
                set: function (context, property, value) {
                    return [this.$value(this, context), property, this.$value(this, value)];
                }
            },
            environment: {
                object: function () {
                    var obj = {};
                    var last = null;
                    Utils.each(Utils.copy(arguments), function (value) {
                        if (last === null) {
                            last = value;
                        } else {
                            obj[last] = this.$value(this, value);
                            last = null;
                        }
                    }, this);
                    return obj;
                },
                get: function (context, property) {
                    return context[property];
                },
                set: function (context, property, value) {
                    context[property] = value;
                    return context;
                },
                apply: function () {
                    var args = Utils.copy(arguments);
                    if (args.length == 0) {
                        throw "No function specified";
                    }
                    var fn = args.splice(0, 1)[0];
                    if (!Utils.isFunction(fn)) {
                        throw "Specified argument is not a function";
                    }
                    return fn.apply(this, args);
                },
                bind: function () {
                    var args = Utils.copy(arguments);
                    if (args.length == 0) {
                        throw "No function specified";
                    }
                    var fn = args.splice(0, 1)[0];
                    if (!Utils.isFunction(fn)) {
                        throw "Specified argument is not a function";
                    }
                    args.splice(0, 0, this);
                    return fn.bind.apply(fn, args);
                }
            }
        };
        lib.environment.apply.$$definition = [['fn', 'arg1', 'arg2', 'arg3', '*']];
        lib.environment.bind.$$definition = [['fn', 'arg1', 'arg2', 'arg3', '*']];
        lib.environment.get.$$definition = [['obj', 'property']];
        lib.environment.set.$$definition = [['obj', 'property', 'value']];
        lib.environment.object.$$definition = [['name1', 'value1', 'name2', 'value2', 'name3', 'value3', '*']];
        lib.environment.apply.$$description = "Will apply the lambda function to the specified arguments. For example, given\n" +
            "a lambda `+` which takes the sum of its two inputs, we can write:" +
            "    (apply + 1 2)\n" +
            "which will have the same effect of writing `(+ 1 2)`";
        lib.environment.bind.$$description = "Will return a lambda that is bound to the given arguments. For instance:" +
            "    (bind + 1)\n" +
            "will return a lambda that, once called, will call `+` with an argument `1` always supplied. So the following call\n" +
            "    (define inc (bind + 1))\n" +
            "    (inc 2 3)\n" +
            "will result in `(+ 1 2 3)` and will resolve to six.";
        lib.environment.get.$$description = "Given an object, will return the value of the specified property.";
        lib.environment.set.$$description = "Given an object, a property name, and a value, will set that value of said property\n" +
            "to the specified value on the given object.";
        lib.environment.object.$$description = "Creates an object from the key-value pairs provided.";
        lib.description = "JavaScript interface library facilitating the creation of objects and using function application";
        Lispy.register('js', lib);
    };

    if (typeof define === "function" && define.amd) {
        /**
         * Registering Lispy as an AMD module if possible.
         */
        define('lispy-js', ['lispy'], function (Lispy) {
            return factory(Lispy);
        });
    } else {
        factory(Lispy);
    }
})();