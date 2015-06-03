/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/2/15, 6:34 PM)
 */
(function () {
    $(document).on('consoleReady', function (e, Console) {
        var env = Lispy.env();
        Console.console.on('autoComplete', function (e, contextHolder) {
            if (contextHolder.type == "all") {
                var context = {};
                if (/\(\s*libs\+\s+([^()]+\s+)*([^()]+)?$/.test(contextHolder.expression)) {
                    var expression = contextHolder.expression.substring(contextHolder.expression.lastIndexOf('libs+') + 5);
                    expression = expression.replace(/^\s+|\s+$/g, "").split(/\s+/);
                    var libs = env['libs*']();
                    Lispy.utils().each(libs, function (name) {
                        if (name[0] != '-') {
                            return;
                        }
                        name = name.substring(1);
                        if (expression.indexOf(name) != -1) {
                            return;
                        }
                        context[name] = {
                            $$type: 'library'
                        }
                    });
                    contextHolder.context = context;
                }
            } else if (contextHolder.type == "func") {
                if (/\(\s*lambda\s+\($/.test(contextHolder.expression)) {
                    contextHolder.context = {};
                }
            }
        });
    })
})();