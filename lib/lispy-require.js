/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (8/31/15)
 */
(function () {

    var factory = function (Lispy) {
        var Utils = Lispy.utils();
        var lib = {
            managers: {
                require: function () {
                    return Utils.copy(arguments);
                }
            },
            environment: {
                require: function () {
                    Lispy.utils().each(arguments, function (script) {
                        if (Lispy.utils().isArray(script) && script[0] == 'str') {
                            script = script[1];
                        }
                        if (Lispy.utils().isString(script)) {
                            if (window) {
                                //if we are in a browser, we know how to fetch the script
                                var element = document.createElement('script');
                                element.setAttribute('type', 'text/javascript');
                                element.setAttribute('src', script);
                                var head = document.getElementsByTagName('head')[0];
                                head.appendChild(element);
                            } else {
                                //otherwise, we do something else
                            }
                        }
                    }, this);
                }
            }
        };
        lib.environment.require.$$definition = [['script1', 'script2', 'script3', '*']];
        lib.environment.require.$$description = "Will load indicated scripts into the global scope, thus enabling\n" +
            "third-party scripts to be added to this console.";
        lib.description = "Library for loading remote script files";
        Lispy.register('require', lib);
        Lispy.load('require', lib);
    };

    if (typeof define === "function" && define.amd) {
        /**
         * Registering Lispy as an AMD module if possible.
         */
        define('lispy-require', ['lispy'], function (Lispy) {
            return factory(Lispy);
        });
    } else {
        factory(Lispy);
    }
})();