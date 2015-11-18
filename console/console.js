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
                    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                    value = value.replace(/ /g, '&nbsp;').replace(/\n/g, '<br/>\n');
                    //todo fix this
                    //value = value.replace(/((?:http|https):\/\/(?!&nbsp;)+)/g, "<a href='$1" + "' target='_blank'>$1</a>");
                    value = value.replace(/`(.*?)`/g, '<code>$1</code>');
                    var output = $("<div></div>");
                    output.addClass(type);
                    output.html(value);
                    Console.console.append(output);
                });
            },
            print: function (what) {
                Lispy.utils().each(arguments, function (what) {
                    Console.log("output", what);
                });
            },
            warn: function (what) {
                Lispy.utils().each(arguments, function (what) {
                    Console.log("warning", what);
                });
            },
            error: function (what) {
                Lispy.utils().each(arguments, function (what) {
                    Console.log("error", what);
                });
            },
            init: function () {
                var thief = $("#focus-thief")[0];
                var eventHandler = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var clone = thief.cloneNode(true);
                    var parent = thief.parentElement;
                    parent.appendChild(clone);
                    parent.replaceChild(clone, thief);
                    thief = clone;
                    setTimeout(function () {
                        thief.value = thief.value || "";
                        thief.focus();
                    }, 0);
                };
                document.body.addEventListener('touchstart', eventHandler);
                document.body.addEventListener('mousedown', eventHandler);
            },
            reset: function () {
                if (Console.console.find('.input').length == 0) {
                    Console.console.append("<div class='input active first'></div>");
                }
                if (!Console.caret) {
                    Console.console.find('.input').last().append('<span class="caret">&nbsp;</span>');
                    Console.caret = Console.console.find('.caret');
                }
            },
            touch: function () {
                $('body .box').each(function () {
                    $(this).data('remove')();
                });
                if (Console.caret && Console.caret.length) {
                    Console.caret.removeClass('faded');
                }
                Console.pointer = Console.history.length;
                Console.console.animate({
                    scrollTop: Console.console.find('div').last().offset().top * 2000
                }, 100);
            },
            type: function (char, complete) {
                var completing = complete !== false && Console.completing();
                Console.touch();
                Console.move();
                var output = $("<span class='character'></span>");
                if (char == ' ') {
                    output.html('&nbsp;');
                } else {
                    output.text(char);
                }
                Console.caret.before(output);
                if (complete !== false && char != ')' && (completing || char == '(')) {
                    Console.complete();
                }
            },
            move: function () {
                Console.console.find('.pair').removeClass('pair');
                Console.console.find('.invalid').removeClass('invalid');
                if (!Console.caret) {
                    return;
                }
                var text = Console.caret.text();
                if (text != '(' && text != ')') {
                    return;
                }
                var pointer = Console.caret;
                var count = 1;
                var quote = false;
                if (text == '(') {
                    //searching for matching closer in the right hand side
                    while (count > 0) {
                        if (pointer.next().hasClass('character')) {
                            pointer = pointer.next();
                        } else if (pointer.parent().next().hasClass('input') && pointer.parent().next().hasClass('active')) {
                            //we are at the end of current line, retrace to connecting line
                            pointer = pointer.parent().next().find('.character').first();
                        } else {
                            //no more characters to go to
                            break;
                        }
                        if (quote) {
                            if (pointer.text() == '"') {
                                quote = false;
                            }
                        } else {
                            if (pointer.text() == '"') {
                                quote = true;
                            } else if (pointer.text() == ')') {
                                count --;
                            } else if (pointer.text() == '(') {
                                count ++;
                            }
                        }
                    }
                } else {
                    //searching for the matching opener in the left hand side
                    while (count > 0) {
                        if (pointer.prev().hasClass('character')) {
                            pointer = pointer.prev();
                        } else if (pointer.parent().prev().hasClass('input') && pointer.parent().prev().hasClass('active')) {
                            //we are at the end of current line, retrace to previous line
                            pointer = pointer.parent().prev().find('.character').last();
                        } else {
                            //no more characters to go to
                            break;
                        }
                        if (quote) {
                            if (pointer.text() == '"') {
                                quote = false;
                            }
                        } else {
                            if (pointer.text() == '"') {
                                quote = true;
                            } else if (pointer.text() == ')') {
                                count ++;
                            } else if (pointer.text() == '(') {
                                count --;
                            }
                        }
                    }
                }
                if (count == 0 && pointer.length != 0) {
                    pointer.addClass('pair');
                } else {
                    Console.caret.addClass('invalid');
                }
            },
            sequence: function (text, complete) {
                $.each(text.split(""), function () {
                    if (this == '\n') {
                        Console.enter();
                    } else {
                        Console.type(this, complete);
                    }
                });
            },
            indent: function () {
                Console.sequence("   ", false);
            },
            enter: function () {
                var current = "";
                Console.console.find('.input.active').last().find('.character').each(function () {
                    current += $(this).text();
                });
                Console.history.push(current);
                Console.touch();
                Console.move();
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
                            console.error(e);
                            Console.error(typeof e.message != "undefined" ? e.message : e);
                        }
                        Console.console.find('.input.active').removeClass('active').addClass('recent');
                        Console.console.append("<div class='input active first'><span class='placeholder'>&nbsp;</span></div>");
                    }
                    Console.reset();
                    if (open > 0 || quotes > 0) {
                        if (Console.caret.parent().prev().hasClass('input') && Console.caret.parent().prev().hasClass('active')) {
                            (function () {
                                if (Console.caret.parent().prev().hasClass('first')) {
                                    Console.indent();
                                } else {
                                    var indentation = "";
                                    var pointer = Console.caret.parent().prev().find('.character').first();
                                    while (/^\s+$/.test(pointer.text())) {
                                        pointer = pointer.next('.character');
                                        indentation += " ";
                                    }
                                    var open = 0;
                                    var quote = false;
                                    while (pointer.length) {
                                        if (quote) {
                                            if (pointer.text() == '"') {
                                                quote = false;
                                            }
                                        } else {
                                            if (pointer.text() == '"') {
                                                quote = true;
                                            } else if (pointer.text() == '(') {
                                                open ++;
                                            } else if (pointer.text() == ')') {
                                                open --;
                                            }
                                        }
                                        pointer = pointer.next('.character');
                                    }
                                    if (!quote) {
                                        if (indentation.length % 3 == 0) {
                                            for (var i = 0; i < indentation.length / 3 + (open <= 0 ? -1 : 1); i ++) {
                                                Console.indent();
                                            }
                                        } else {
                                            Console.sequence(indentation);
                                        }
                                    }
                                }
                            })();
                        }
                    }
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
                var completing = Console.completing(true);
                Console.touch();
                Console.move();
                var caret = Console.caret;
                var previous = caret.prev('.character');
                if (previous.length) {
                    previous.remove();
                } else if (caret.parent().prev().hasClass('input') && caret.parent().prev().hasClass('active')) {
                    var selection = Console.caret.nextUntil(".caret");
                    selection.splice(0, 0, Console.caret[0]);
                    var line = caret.parent().prev();
                    $.each(selection, function () {
                        line.append(this);
                    });
                    line.next().remove();
                }
                if (Lispy.utils().isDefined(completing) && completing != "") {
                    Console.complete();
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
                } else if (Console.caret.parent().prev().hasClass('input') && Console.caret.parent().prev().hasClass('active')) {
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
                Console.move();
            },
            right: function () {
                Console.touch();
                var substitute = Console.caret.next('.character');
                if (substitute.length) {
                    Console.caret.removeClass('active');
                    Console.caret = substitute;
                    Console.caret.addClass('active');
                } else if (Console.caret.parent().next().hasClass('input') && Console.caret.parent().next().hasClass('active')) {
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
                    Console.reset();
                }
                Console.move();
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
                Console.reset();
                Console.sequence(Console.history[pointer], false);
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
                Console.reset();
                if (pointer < Console.history.length) {
                    Console.sequence(Console.history[pointer], false);
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
            },
            completing: function (returnToken) {
                var $box = $('body .box');
                return returnToken ? $box.attr('data-token') : $box.length != 0;
            },
            complete: function (autoFinish) {
                var Utils = Lispy.utils();
                Console.touch();
                if (!Console.caret) {
                    return;
                }
                var expression = "";
                var pointer = Console.caret ? Console.caret.prev('.character') : null;
                while (pointer && pointer.length) {
                    if (pointer.hasClass('character')) {
                        expression = pointer.text() + expression;
                        pointer = pointer.prev();
                    } else if (pointer.parent().prev().hasClass('input') && pointer.parent().prev().hasClass('active')) {
                        pointer = pointer.parent().prev().find('.character').last();
                    } else {
                        pointer = null;
                    }
                }
                var cursor = 0;
                var marker = -1;
                while (cursor < expression.length) {
                    if (expression[cursor] == ')') {
                        marker = cursor;
                    } else if (expression[cursor] == '"') {
                        cursor ++;
                        while (cursor < expression.length && expression[cursor] != '"') {
                            cursor ++;
                        }
                        if (cursor < expression.length) {
                            marker = cursor;
                        }
                    }
                    cursor ++;
                }
                var originalExpression = expression;
                expression = expression.substring(marker + 1);
                var type = "all";
                var token = null;
                if (/^\s*[^(]+$/.test(expression)) {
                    //first token in the current stream
                    token = expression.replace(/^\s*/, "");
                } else if (/\($/.test(expression)) {
                    type = "func";
                    token = "";
                } else {
                    var exp = /(\(|[^)]\s+)\s*([^\s\(]+)$/;
                    var groups = exp.exec(expression);
                    if (groups && groups.length > 2) {
                        if (groups[1] == '(') {
                            type = "func";
                        }
                        token = groups[2];
                    }
                }
                if (token === null) {
                    if (/^\s+$/.test(expression)) {
                        return;
                    } else {
                        token = "";
                    }
                }
                var env = Lispy.env();
                var contextHolder = {
                    context: env,
                    prefix: token,
                    type: type,
                    caret: Console.caret,
                    expression: originalExpression
                };
                Console.console.trigger('autoComplete', contextHolder);
                env = Utils.isObject(contextHolder.context) ? contextHolder.context : env;
                var candidates = [];
                Utils.each(env, function (value, name) {
                    if (name.substring(0, token.length) == token) {
                        if (type == 'all' || (type == 'func' && Utils.isFunction(value))) {
                            candidates.push({
                                name: name.substring(token.length),
                                type: Utils.isObject(value) && Utils.isString(value.$$type) ? value.$$type : (value === null ? 'null' : (Utils.isFunction(value) ? 'lambda' : typeof(value))),
                                value: value
                            });
                        }
                    }
                });
                if (candidates.length == 0) {
                    Console.touch();
                    return;
                }
                var complete = function (index, smart) {
                    var candidate = candidates[index];
                    Console.sequence(candidate.name, false);
                    if (smart) {
                        if (Utils.isFunction(candidate.value)) {
                            if (candidate.value.$$definition) {
                                var args = candidate.value.$$definition[0];
                                if (args.length == 0) {
                                    Console.sequence(")");
                                } else {
                                    Console.sequence(" ");
                                    Console.complete(false);
                                }
                            }
                        } else {
                            Console.sequence(" ");
                            Console.complete(false);
                        }
                    }
                };
                if (candidates.length == 1 && autoFinish !== false) {
                    complete(0, true);
                    return;
                }
                candidates.sort(function (a, b) {
                    return a.name < b.name ? -1 : 1;
                });
                var box = $("<div class='box'></div>");
                box.attr('data-token', token);
                box.attr('data-type', type);
                Utils.each(candidates, function (candidate) {
                    var item = $("<div class='item'><span class='title'><span class='prefix'></span><span class='suffix'></span></span><span class='type'></span></div>");
                    item.addClass(candidate.type);
                    item.find('.prefix').text(token);
                    item.find('.suffix').text(candidate.name);
                    item.find('.type').text(candidate.type);
                    item.on('click', function () {
                        Console.sequence(candidate.name, false);
                    });
                    box.append(item);
                });
                $('body').append(box);
                box.css({
                    top: (Console.caret.offset().top + Console.caret.height()) + 'px',
                    left: Console.caret.offset().left + 'px'
                });
                var current = -1;
                var up = function () {
                    current --;
                    if (current < 0) {
                        current = candidates.length - 1;
                    }
                    focus();
                };
                var down = function () {
                    current ++;
                    if (current > candidates.length - 1) {
                        current = 0;
                    }
                    focus();
                };
                var focus = function () {
                    box.find('> div').removeClass('active');
                    box.find('> div').eq(current).addClass('active');
                    box.animate({
                        scrollTop: 20 * current
                    }, 0);
                };
                down();
                var keyHandler = function (e) {
                    var keys = {
                        tab: 9,
                        enter: 13,
                        up: 38,
                        down: 40,
                        esc: 27
                    };
                    if ([keys.tab, keys.enter, keys.up, keys.down, keys.esc].indexOf(e.keyCode) != -1) {
                        e.preventDefault();
                    }
                    switch (e.keyCode) {
                        case keys.esc:
                            box.data('remove')();
                            break;
                        case keys.up:
                            up();
                            break;
                        case keys.down:
                            down();
                            break;
                        case keys.tab:
                            complete(current, true);
                            break;
                        case keys.enter:
                            complete(current, false);
                            break;
                    }
                };
                box.data('remove', function () {
                    box.remove();
                    $(document).off('keydown', keyHandler);
                });
                $(document).on('keydown', keyHandler);
            }
        };
        setTimeout(function () {
            Console.reset();
            var $paste = $("#paste");
            $paste.find('.cancel').on('click', function () {
                $paste.hide();
            });
            $paste.find('.submit').on('click', function () {
                Console.sequence($paste.find('textarea').val(), false);
                $paste.hide();
            });
            $(document).on('keydown', function (e) {
                var keys = {
                    backspace: 8,
                    tab: 9,
                    enter: 13,
                    space: 32,
                    home: 36,
                    end: 35,
                    up: 38,
                    down: 40,
                    left: 37,
                    right: 39,
                    chrV: 86
                };
                if ([keys.backspace, keys.end, keys.home, keys.left, keys.right].indexOf(e.keyCode) != -1) {
                    e.preventDefault();
                }
                if (e.keyCode == keys.enter) {
                    if (!Console.completing()) {
                        Console.enter();
                        e.preventDefault();
                    }
                } else if (e.keyCode == keys.backspace) {
                    Console.del();
                } else if (e.keyCode == keys.tab) {
                    if (!Console.completing()) {
                        Console.indent();
                        e.preventDefault();
                    }
                } else if (e.keyCode == keys.up) {
                    if (!Console.completing()) {
                        Console.up();
                        e.preventDefault();
                    }
                } else if (e.keyCode == keys.down) {
                    if (!Console.completing()) {
                        Console.down();
                        e.preventDefault();
                    }
                } else if (e.keyCode == keys.left) {
                    Console.left();
                } else if (e.keyCode == keys.right) {
                    Console.right();
                } else if (e.keyCode == keys.end) {
                    Console.end();
                } else if (e.keyCode == keys.home) {
                    Console.beginning();
                } else if ((e.metaKey || e.ctrlKey) && e.keyCode == keys.chrV) {
                    Console.touch();
                    $paste.show();
                    $paste.find('textarea').val('');
                    $paste.find('textarea').focus();
                } else if (e.ctrlKey && e.keyCode == keys.space) {
                    Console.complete();
                    e.preventDefault();
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
            $(document).trigger('consoleReady', Console);
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
        //noinspection JSUnusedGlobalSymbols
        var lib = {
            managers: {
                publish: function () {
                    var array = [];
                    for (var i = 0; i < arguments.length; i++) {
                        array.push(arguments[i]);
                    }
                    return array;
                },
                'export': function () {
                    var array = [];
                    for (var i = 0; i < arguments.length; i++) {
                        array.push(arguments[i]);
                    }
                    return array;
                }
            },
            environment: {
                print: Console.print,
                error: Console.error,
                warn: Console.warn,
                help: function (command) {
                    if (arguments.length) {
                        if (typeof command == 'undefined' || !command.$$name) {
                            this.print("No help is available for this item");
                            return;
                        }
                        this.print("Variable: " + command.$$name);
                        if (command.$$definition) {
                            var usage = "(" + command.$$name;
                            for (var i = 0; i < command.$$definition[0].length; i ++) {
                                var parameter = command.$$definition[0][i];
                                if (parameter == '*') {
                                    parameter = '...';
                                }
                                usage += " " + parameter;
                            }
                            usage += ")";
                            this.print("Usage: " + usage);
                        }
                        if (command.$$origin) {
                            this.print("Defined in: " + command.$$origin);
                        }
                        if (command.$$description) {
                            this.print("");
                            this.print(command.$$description);
                        }
                        return;
                    }
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
                    this.print('You can see a more detailed tutorial by issuing the `(tutorial)` command.');
                    this.print('To know more about a specific command you can issue `(help command)` to');
                    this.print('get to know more.');
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
                    Console.console.find("div").remove();
                },
                publish: function () {
                    var result = {};
                    var env = this;
                    var src = [];
                    $.each(arguments, function (index, name) {
                        if (typeof env[name] == "undefined") {
                            env.error("Unknown object: " + name);
                        } else if ($.isFunction(env[name])) {
                            if (env[name].$$definition && env[name].$$definition.length > 1) {
                                var definition = ['lambda'];
                                for (var i = 0; i < env[name].$$definition.length; i++) {
                                    definition.push(env[name].$$definition[i]);
                                }
                                result[name] = definition;
                            } else {
                                env.warn("Cannot publish native function: " + name);
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
                },
                'export': function () {
                    var result = {};
                    var env = this;
                    var src = '';
                    $.each(arguments, function (index, name) {
                        if (typeof env[name] == "undefined") {
                            env.error("Unknown object: " + name);
                        } else if ($.isFunction(env[name])) {
                            if (env[name].$$definition && env[name].$$definition.length > 1) {
                                var definition = ['lambda'];
                                for (var i = 0; i < env[name].$$definition.length; i++) {
                                    definition.push(env[name].$$definition[i]);
                                }
                                result[name] = definition;
                            } else {
                                env.warn("Cannot publish native function: " + name);
                            }
                        } else {
                            result[name] = env[name];
                        }
                    });
                    $.each(result, function (name, value) {
                        src += '(define ' + name + ' ';
                        (function convert(value) {
                            if (Lispy.utils().isArray(value)) {
                                src += '(';
                                Lispy.utils().each(value, function (value) {
                                    convert(value);
                                    src += ' ';
                                });
                                src += ')';
                            } else if (Lispy.utils().isString(value)) {
                                src += value;
                            } else {
                                src += Lispy.utils().toString(value, true);
                            }
                        })(value);
                        src += ')';
                    });
                    if (src.length == 0) {
                        return;
                    }
                    return src;
                },
                'tutorial': function () {
                    this.print("The Environment");
                    this.print("===============");
                    this.print("The basic way to manipulate the environment is by defining variables:");
                    this.print("    (define x 1)");
                    this.print("This will create a variable named `x` with its value set to `1`");
                    this.print("You can also query the value of a variable using the `val` function:");
                    this.print("    (val x)");
                    this.print("Another basic example would be creating a function object:");
                    this.print("    (lambda (a b) (+ a b))");
                    this.print("Which creates a function that upon execution returns the summation of its two arguments");
                    this.print("You can now give this lambda object a name so that you can call it:");
                    this.print("    (define add (lambda (a b) (+ a b)))");
                    this.print("Now calling `(add 1 2)` will return `3`");
                    this.print("");
                    this.print("Libraries");
                    this.print("=========");
                    this.print("Libraries are pre-created sets of commands that can help you with writing your own dialects.");
                    this.print("You can see a list of available libraries using:");
                    this.print("    (libs*)");
                    this.print("To load a library, you can simply type:");
                    this.print("    (libs+ ...)");
                    this.print("where `...` is replaced by the name of the library you want to load.");
                }
            }
        };
        lib.environment.clear.$$definition = [[]];
        lib.environment.error.$$definition = [['msg']];
        lib.environment.help.$$definition = [['command']];
        lib.environment.ls.$$definition = [[]];
        lib.environment.print.$$definition = [['msg']];
        lib.environment.publish.$$definition = [['var1', 'var2', 'var3', '*']];
        lib.environment.tutorial.$$definition = [[]];
        lib.environment.clear.$$description = "Clears the console";
        lib.environment.error.$$description = "Prints an error message to the output";
        lib.environment.help.$$description = "Brings up general console directions. Can also be used to get more specific insight about a command";
        lib.environment.ls.$$description = "Lists everything available in the environment";
        lib.environment.print.$$description = "Prints a given message to the standard output";
        lib.environment.publish.$$description = "Publishes a JavaScript snippet that would define the given command in Lispy";
        lib.environment.tutorial.$$description = "A short tutorial about Lispy and Lisp in general";
        Lispy.load('console', lib);
        window.onerror = function (error, file, line, column, message) {
            Console.error(message);
        };
        Console.init();
    });
})(jQuery);