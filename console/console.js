/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/1/15, 1:33 PM)
 */
(function ($) {
    $(function () {
        var Console = {
            console: $("#console"),
            caret: null,
            history: [],
            pointer: 0,
            log: function (type, what) {
                what = Lispy.utils().toString(what).split("\n");
                $.each(what, function (index, value) {
                    var output = $("<div></div>");
                    output.addClass(type);
                    output.text(value);
                    value = output.text();
                    value = value.replace(/(\S+:\/\/\S+)/, "<a href='$1'>$1</a>");
                    output.html(value);
                    Console.console.append(output);
                });
            },
            print: function (what) {
                Console.log("output", what);
            },
            error: function (what) {
                Console.log("error", what);
            },
            init: function () {
                if (Console.console.find('.input').length == 0) {
                    Console.console.append("<div class='input active first'></div>");
                }
                if (!Console.caret) {
                    Console.console.find('.input').last().append('<span class="caret">&nbsp;</span>');
                    Console.caret = Console.console.find('.caret');
                }
            },
            touch: function () {
                Console.move();
                Console.pointer = Console.history.length;
                Console.console.animate({
                    scrollTop: Console.console.find('div').last().offset().top * 2000
                }, 100);
            },
            type: function (char) {
                Console.touch();
                var output = $("<span class='character'></span>");
                if (char == ' ') {
                    output.html('&nbsp;');
                } else {
                    output.text(char);
                }
                Console.caret.before(output);
            },
            move: function () {
                if (Console.caret && Console.caret.length) {
                    Console.caret.removeClass('faded');
                }
            },
            sequence: function (text) {
                $.each(text.split(""), function () {
                    if (this == '\n') {
                        Console.enter();
                    } else {
                        Console.type(this);
                    }
                });
            },
            enter: function () {
                var current = "";
                Console.console.find('.input.active').last().find('.character').each(function () {
                    current += $(this).text();
                });
                Console.history.push(current);
                Console.touch();
                if (Console.caret.hasClass('caret')) {
                    //the caret is at the end of the line and this is an intelligent return key
                    var statement = [];
                    Console.console.find('.input.active').each(function () {
                        var line = "";
                        $(this).find('.character').each(function () {
                            line += $(this).text();
                        });
                        statement.push(line);
                    });
                    statement = statement.join("\n");
                    if (/^\s*$/.test(statement)) {
                        //it is only an empty string an we don't need to do anything with it
                        return;
                    }
                    var open = 0;
                    var quotes = 0;
                    for (var cursor = 0; cursor < statement.length; cursor ++) {
                        if (statement[cursor] == '(') {
                            open ++;
                        } else if (statement[cursor] == ')') {
                            open --;
                        } else if (statement[cursor] == '"') {
                            cursor ++;
                            while (cursor < statement.length && statement[cursor] != '"') {
                                cursor ++;
                            }
                        }
                    }
                    Console.caret.remove();
                    Console.caret = null;
                    if (open > 0 || quotes > 0) {
                        //we are in the middle of a statement and this is a hard wrap rather than a command issuance
                        Console.console.append("<div class='input active'><span class='placeholder'>&nbsp;</span></div>");
                    } else {
                        try {
                            $.each(Lispy.execute(statement), function (index, value) {
                                if (typeof value == "undefined") {
                                    return;
                                }
                                Console.print(value);
                            });
                        } catch (e) {
                            Console.error(typeof e.message != "undefined" ? e.message : e);
                        }
                        Console.console.find('.input.active').removeClass('active').addClass('recent');
                        Console.console.append("<div class='input active first'><span class='placeholder'>&nbsp;</span></div>");
                    }
                    Console.init();
                } else if (Console.caret.hasClass('character')) {
                    //we are in the middle of the line, so just break the line where the caret is
                    var selection = Console.caret.nextUntil(".caret");
                    selection.splice(0, 0, Console.caret[0]);
                    Console.caret.parent().after("<div class='input active'><span class='placeholder'>&nbsp;</span></div>");
                    var nextLine = Console.caret.parent().next();
                    selection.each(function () {
                        nextLine.append(this);
                    });
                }
            },
            del: function () {
                Console.touch();
                var caret = Console.caret;
                var previous = caret.prev('.character');
                if (previous.length) {
                    previous.remove();
                } else if (caret.parent().prev().hasClass('input active')) {
                    var selection = Console.caret.nextUntil(".caret");
                    selection.splice(0, 0, Console.caret[0]);
                    var line = caret.parent().prev();
                    $.each(selection, function () {
                        line.append(this);
                    });
                    line.next().remove();
                }
            },
            left: function () {
                Console.touch();
                var substitute = Console.caret.prev('.character');
                if (substitute.length) {
                    if (Console.caret.hasClass('caret')) {
                        Console.caret.remove();
                        Console.caret = substitute;
                        Console.caret.addClass('active');
                    } else if (Console.caret.hasClass('character')) {
                        Console.caret.removeClass('active');
                        Console.caret = substitute;
                        Console.caret.addClass('active');
                    }
                } else if (Console.caret.parent().prev().hasClass('input active')) {
                    substitute = Console.caret.parent().prev().find('.character').last();
                    if (substitute.length == 0) {
                        //previous line is empty
                        substitute = $("<span class='caret'>&nbsp;</span>");
                        Console.caret.parent().prev().append(substitute);
                    }
                    if (Console.caret.hasClass('caret')) {
                        Console.caret.remove();
                        Console.caret = substitute;
                        Console.caret.addClass('active');
                    } else if (Console.caret.hasClass('character')) {
                        Console.caret.removeClass('active');
                        Console.caret = substitute;
                        Console.caret.addClass('active');
                    }
                }
            },
            right: function () {
                Console.touch();
                var substitute = Console.caret.next('.character');
                if (substitute.length) {
                    Console.caret.removeClass('active');
                    Console.caret = substitute;
                    Console.caret.addClass('active');
                } else if (Console.caret.parent().next().hasClass('input active')) {
                    substitute = Console.caret.parent().next().find('.character').first();
                    if (substitute.length == 0) {
                        //next line is empty
                        substitute = $("<span class='caret'>&nbsp;</span>");
                        Console.caret.parent().next().append(substitute);
                    }
                    if (Console.caret.hasClass('caret')) {
                        Console.caret.remove();
                        Console.caret = substitute;
                        Console.caret.addClass('active');
                    } else if (Console.caret.hasClass('character')) {
                        Console.caret.removeClass('active');
                        Console.caret = substitute;
                        Console.caret.addClass('active');
                    }
                } else if (!Console.caret.hasClass('caret')) {
                    //this is the last line and we have to insert a caret
                    Console.caret.removeClass('active');
                    Console.caret = null;
                    Console.init();
                }
            },
            up: function () {
                if (Console.history.length == 0) {
                    return;
                }
                var pointer = Console.pointer - 1;
                if (pointer < 0) {
                    pointer = 0;
                }
                Console.console.find('.input.active').last().find('.character').remove();
                Console.console.find('.input.active').last().find('.caret').remove();
                Console.caret = null;
                Console.init();
                Console.sequence(Console.history[pointer]);
                Console.pointer = pointer;
            },
            down: function () {
                if (Console.history.length == 0 || Console.pointer == Console.history.length) {
                    return;
                }
                var pointer = Console.pointer + 1;
                if (pointer > Console.history.length) {
                    pointer = Console.history.length;
                }
                Console.console.find('.input.active').last().find('.character').remove();
                Console.console.find('.input.active').last().find('.caret').remove();
                Console.caret = null;
                Console.init();
                if (pointer < Console.history.length) {
                    Console.sequence(Console.history[pointer]);
                }
                Console.pointer = pointer;
            },
            beginning: function () {
                while (Console.caret && Console.caret.length && Console.caret.prev('.character').length) {
                    Console.left();
                }
            },
            end: function () {
                while (Console.caret && Console.caret.length && Console.caret.next('.character').length) {
                    Console.right();
                }
            }
        };
        setTimeout(function () {
            Console.init();
            var $paste = $("#paste");
            $paste.find('.cancel').on('click', function () {
                $paste.hide();
            });
            $paste.find('.submit').on('click', function () {
                Console.sequence($paste.find('textarea').val());
                $paste.hide();
            });
            $(document).on('keydown', function (e) {
                if ([8, 9, 13, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) != -1) {
                    e.preventDefault();
                }
                if (e.keyCode == 13) {
                    Console.enter();
                } else if (e.keyCode == 8) {
                    Console.del();
                } else if (e.keyCode == 9) {
                    Console.sequence("   ");
                } else if (e.keyCode == 38) {
                    Console.up();
                } else if (e.keyCode == 40) {
                    Console.down();
                } else if (e.keyCode == 37) {
                    Console.left();
                } else if (e.keyCode == 39) {
                    Console.right();
                } else if (e.keyCode == 35) {
                    Console.end();
                } else if (e.keyCode == 36) {
                    Console.beginning();
                }
                if ((e.metaKey || e.ctrlKey) && e.keyCode == 86) {
                    $paste.show();
                    $paste.find('textarea').val('');
                    $paste.find('textarea').focus();
                }
            });
            $(document).on('keypress', function (e) {
                var char = String.fromCharCode(e.which);
                Console.type(char);
            });
            $paste.on('keypress', function (e) {
                e.stopPropagation();
            });
            $paste.on('keydown', function (e) {
                e.stopPropagation();
            });
        }, 100);
        (function () {
            var CaretFading = {
                find: function () {
                    var current = Console.console.find('.faded');
                    if (!current || !current.length) {
                        current = Console.console.find('.input.active').find('.character.active');
                    }
                    if (!current || !current.length) {
                        current = Console.console.find('.input.active').find('.caret');
                    }
                    if (!current || !current.length) {
                        return null;
                    } else {
                        return current;
                    }
                },
                animate: function () {
                    var current = CaretFading.find();
                    if (current) {
                        if (current.hasClass('faded')) {
                            current.removeClass('faded');
                        } else {
                            current.addClass('faded');
                        }
                    }
                }
            };
            setInterval(CaretFading.animate, 1000);
        })();
        Lispy.load({
            managers: {
                publish: function () {
                    var array = [];
                    for (var i = 0; i < arguments.length; i ++) {
                        array.push(arguments[i]);
                    }
                    return array;
                }
            },
            environment: {
                print: Console.print,
                error: Console.error,
                help: function () {
                    this.print('This is a normal LISP console. You can execute functions');
                    this.print('using the (fn ...) syntax');
                    this.print('You can explore the commands available to you by executing');
                    this.print('the `ls` function');
                    this.print('');
                    this.print('Moreover, you can prepend the "(" with a tick "\'" to disable');
                    this.print('evaluation for the list that follows (which is exactly like');
                    this.print('writing a list with the "quote" function) and avoid evaluating');
                    this.print('certain tokens by enclosing them in double quotes (which is');
                    this.print('exactly like using the "str" function)');
                    this.print('');
                    this.print('You can also issue (clear) to clear the console');
                },
                ls: function () {
                    var env = this;
                    env.print('In your environment, you have:');
                    var vars = [];
                    var func = [];
                    $.each(env, function (name, value) {
                        if (name == '$value' || name == '$interpret') {
                            return;
                        }
                        if (value instanceof Function) {
                            func.push(name);
                        } else {
                            vars.push(name);
                        }
                    });
                    vars.sort();
                    func.sort();
                    env.print('Variables:');
                    $.each(vars, function (index, item) {
                        env.print("   " + item);
                    });
                    env.print('Functions:');
                    $.each(func, function (index, item) {
                        env.print("    " + item);
                    });
                    env.print("");
                    env.print("You can also use (libs) and (libs-load `name`) to list what");
                    env.print("libraries are available and to load new ones.");
                },
                clear: function () {
                    Console.console.html("");
                    Console.init();
                },
                publish: function () {
                    var result = {};
                    var env = this;
                    var src = [];
                    $.each(arguments, function (index, name) {
                        if (typeof env[name] == "undefined") {
                            env.error("Unknown object: " + name);
                        }
                        if ($.isFunction(env[name])) {
                            if (env[name].$$definition) {
                                var definition = ['lambda'];
                                for (var i = 0; i < env[name].$$definition.length; i ++) {
                                    definition.push(env[name].$$definition[i]);
                                }
                                result[name] = definition;
                            } else {
                                env.error("Cannot publish native function: " + name);
                            }
                        } else {
                            result[name] = env[name];
                        }
                    });
                    $.each(result, function (name, value) {
                        src.push("Lispy.interpret(['define', '" + name + "', " + Lispy.utils().toString(value, true) + "]);");
                    });
                    if (src.length == 0) {
                        return;
                    }
                    return src.join("\n");
                }
            }
        });
    });
})(jQuery);