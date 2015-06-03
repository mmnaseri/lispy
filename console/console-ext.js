/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/2/15, 6:34 PM)
 */
(function () {
    $(document).on('consoleReady', function (e, Console) {
        var env = Lispy.env();
        Console.console.on('autoComplete', function (e, contextHolder) {
            var context = contextHolder.context;
            if (contextHolder.type == "all") {
                if (/\(\s*libs\+\s+([^()]+\s+)*([^()]+)?$/.test(contextHolder.expression)) {
                    var expression = contextHolder.expression.substring(contextHolder.expression.lastIndexOf('libs+') + 5);
                    expression = expression.replace(/^\s+|\s+$/g, "").split(/\s+/);
                    var libs = env['libs*']();
                    context = {};
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
                } else if (/\(\s*(define|label)\s+$/.test(contextHolder.expression)) {
                    context = {};
                }
            } else if (contextHolder.type == "func") {
                if (/\(\s*(lambda|let)\s+\($/.test(contextHolder.expression)) {
                    context = {};
                }
            }
            contextHolder.context = context;
        });
    })
})();