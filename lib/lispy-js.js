/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/2/15, 12:38 PM)
 */
(function () {

    var factory = function (Lispy) {
        var Utils = Lispy.utils();
        Lispy.register('js', {
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
        });
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