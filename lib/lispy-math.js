/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/2/15, 12:38 PM)
 */
(function () {

    var factory = function (Lispy) {
        var library = {
            environment: {
                E: Math.E,
                LN2: Math.LN2,
                LN10: Math.LN10,
                LOG2E: Math.LOG2E,
                LOG10E: Math.LOG10E,
                PI: Math.PI,
                SQRT1_2: Math.SQRT1_2,
                SQRT2: Math.SQRT2,
                abs: Math.abs,
                acos: Math.acos,
                asin: Math.asin,
                atan: Math.atan,
                atan2: Math.atan2,
                ceil: Math.ceil,
                cos: Math.cos,
                exp: Math.exp,
                floor: Math.floor,
                log: Math.log,
                max: Math.max,
                min: Math.min,
                pow: Math.pow,
                random: Math.random,
                round: Math.round,
                sin: Math.sin,
                sqrt: Math.sqrt,
                tan: Math.tan
            }
        };
        Lispy.utils().each(library.environment, function (value) {
            if (Lispy.utils().isFunction(value)) {
                value.$$definition = [['a']];
            }
        });
        Lispy.register('math', library);
    };

    if (typeof define === "function" && define.amd) {
        /**
         * Registering Lispy as an AMD module if possible.
         */
        define('lispy-math', ['lispy'], function (Lispy) {
            return factory(Lispy);
        });
    } else {
        factory(Lispy);
    }
})();

