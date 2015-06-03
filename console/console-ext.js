/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/2/15, 6:34 PM)
 */
(function () {
    $(document).on('consoleReady', function (e, Console) {
        Console.console.on('autoComplete', function (e, contextHolder) {
            if (contextHolder.prefix == "" && contextHolder.type == "all") {
                var context = {};
                if (/\(\s*libs\+\s+([^()]+\s+)*$/.test(contextHolder.expression)) {
                    var libs = Lispy.env()['libs*']();
                    Lispy.utils().each(libs, function (name) {
                        if (name[0] != '-') {
                            return;
                        }
                        name = name.substring(1);
                        context[name] = {
                            $$type: 'library'
                        }
                    });
                    contextHolder.context = context;
                }
            }
        });
    })
})();