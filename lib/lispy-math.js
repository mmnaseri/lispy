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
                abs: Math.abs.bind(Math),
                acos: Math.acos.bind(Math),
                asin: Math.asin.bind(Math),
                atan: Math.atan.bind(Math),
                atan2: Math.atan2.bind(Math),
                ceil: Math.ceil.bind(Math),
                cos: Math.cos.bind(Math),
                exp: Math.exp.bind(Math),
                floor: Math.floor.bind(Math),
                log: Math.log.bind(Math),
                max: Math.max.bind(Math),
                min: Math.min.bind(Math),
                pow: Math.pow.bind(Math),
                random: Math.random.bind(Math),
                round: Math.round.bind(Math),
                sin: Math.sin.bind(Math),
                sqrt: Math.sqrt.bind(Math),
                tan: Math.tan.bind(Math)
            }
        };
        Lispy.utils().each(library.environment, function (value) {
            if (Lispy.utils().isFunction(value)) {
                value.$$definition = [['a']];
            }
        });
        library.description = "A library exposing all the functions available from the Math utility class in JavaScript";
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

