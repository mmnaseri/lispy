/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (5/29/15, 9:07 AM)
 */

describe("In the core of the language", function () {

    beforeEach(function () {
        Lispy.reset();
    });

    describe("primitive atoms", function () {

        var spy;
        var functionName = 'myFunction';

        beforeEach(function () {
            spy = jasmine.createSpy("spy");
            Lispy.handle(functionName, spy);
        });

        it("should contain `T` which maps to `true`", function () {
            expect(spy).not.toHaveBeenCalled();
            Lispy.interpret([functionName, 'T']);
            expect(spy).toHaveBeenCalledWith(true);
            expect(spy.calls.count()).toBe(1);
        });

        it("should contain `F` which maps to `false`", function () {
            expect(spy).not.toHaveBeenCalled();
            Lispy.interpret([functionName, 'F']);
            expect(spy).toHaveBeenCalledWith(false);
            expect(spy.calls.count()).toBe(1);
        });

    });

    describe("`val`", function () {

        it("should return the value of anything in the environment", function () {
            var random = Math.random();
            expect(Lispy.interpret(['val', 'x'], {
                x: random
            })).toBe(random);
        });

        it("should return `null` for anything that is not defined", function () {
            expect(Lispy.interpret(['val', 'x'])).toBeNull();
        });

    });

    describe("`quote`", function () {

        it("should return `null` when given an empty argument list", function () {
            expect(Lispy.interpret(['quote'])).toBeNull();
        });

        it("should create a list of items from the arguments without evaluating", function () {
            expect(Lispy.interpret(['quote', ['quote', 'a', 'b'], 'c'])).toEqual([['quote', 'a', 'b'], 'c']);
        });

    });

    describe("`car`", function () {

        it("should return `null` on a non-list", function () {
            expect(Lispy.interpret(['car', '1'])).toBeNull();
        });

        it("should return `null` for an empty list", function () {
            expect(Lispy.interpret(['car', []])).toBeNull();
        });

        it("should return the first item of a list", function () {
            var first = '1';
            var second = '2';
            var third = '3';
            expect(Lispy.interpret(['car', ['quote', first, second, third]])).toBe(first);
        });

    });

    describe("`cdr`", function () {

        it("should return `null` for non-lists", function () {
            expect(Lispy.interpret(['cdr', '1'])).toBeNull();
        });

        it("should return `null` for an empty list", function () {
            expect(Lispy.interpret(['cdr', []])).toBeNull();
        });

        it("should return `null` for a list containing a single element", function () {
            expect(Lispy.interpret(['cdr', ['quote', '1']])).toBeNull();
        });

        it("should return all elements except the first one", function () {
            var first = '1';
            var second = '2';
            var third = '3';
            expect(Lispy.interpret(['cdr', ['quote', first, second, third]])).toEqual([second, third]);
        });

    });

    describe("`cons`", function () {

        it("should return `null` if both inputs are non-array", function () {
            expect(Lispy.interpret(['cons', null, undefined])).toBeNull();
        });

        it("should return `null` if both inputs are empty lists", function () {
            expect(Lispy.interpret(['cons', [], []])).toBeNull();
        });

        it("should prepend the first argument to the second list if the first is not a list", function () {
            expect(Lispy.interpret(['cons', 1, [2, 3]])).toEqual([1, 2, 3]);
        });

        it("should prepend the second argument to the first list if the second is not a list", function () {
            expect(Lispy.interpret(['cons', [1, 2], 3])).toEqual([1, 2, 3]);
        });

        it("should append the second list to the first list", function () {
            expect(Lispy.interpret(['cons', [1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
        });

    });

    describe("`define`", function () {

        var spy;
        var functionName = 'myFunction';

        beforeEach(function () {
            spy = jasmine.createSpy();
            Lispy.handle(functionName, spy);
        });

        it("should populate the environment with the specified value", function () {
            var value = Math.random();
            expect(spy).not.toHaveBeenCalled();
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(1);
            expect(spy.calls.mostRecent().args).toEqual([undefined]);
            Lispy.interpret(['define', 'x', value]);
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(2);
            expect(spy.calls.mostRecent().args).toEqual([value]);
        });

        it("should use the interpreter in getting the value evaluated before assigning it to the variable", function () {
            expect(spy).not.toHaveBeenCalled();
            Lispy.interpret(['define', 'x', 'T']);
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(1);
            expect(spy).toHaveBeenCalledWith(true);
        });

    });

    describe("`let`", function () {

        var spy;
        var functionName = 'myFunction';

        beforeEach(function () {
            spy = jasmine.createSpy();
            Lispy.handle(functionName, spy);
        });

        it("should create a local scope for the variables defined", function () {
            var value = Math.random();
            expect(spy).not.toHaveBeenCalled();
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(1);
            expect(spy.calls.mostRecent().args).toEqual([undefined]);
            Lispy.interpret(['let', [['x', value]], [functionName, 'x']]);
            expect(spy.calls.count()).toBe(2);
            expect(spy.calls.mostRecent().args).toEqual([value]);
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(3);
            expect(spy.calls.mostRecent().args).toEqual([undefined]);
        });

        it("should override values for the current scope", function () {
            var original = Math.random();
            Lispy.load({
                environment: {
                    x: original
                }
            });
            var changed = Math.random();
            expect(spy).not.toHaveBeenCalled();
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(1);
            expect(spy.calls.mostRecent().args).toEqual([original]);
            Lispy.interpret(['let', [['x', changed]], [functionName, 'x']]);
            expect(spy.calls.count()).toBe(2);
            expect(spy.calls.mostRecent().args).toEqual([changed]);
            Lispy.interpret([functionName, 'x']);
            expect(spy.calls.count()).toBe(3);
            expect(spy.calls.mostRecent().args).toEqual([original]);
        });

    });

    describe("`cond`", function () {

        it("should return `null` if no clauses are present", function () {
            expect(Lispy.interpret(['cond'])).toBeNull();
        });

        it("should terminate once the first `true` value is reached", function () {
            var first = jasmine.createSpy("first");
            var second = jasmine.createSpy("second");
            var third = jasmine.createSpy("third");
            Lispy.handle('f1', first);
            Lispy.handle('f2', second);
            Lispy.handle('f3', third);
            expect(first).not.toHaveBeenCalled();
            expect(second).not.toHaveBeenCalled();
            expect(third).not.toHaveBeenCalled();
            Lispy.interpret(['cond', ['F', ['f1']], ['T', ['f2']], ['T', ['f3']]]);
            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalled();
            expect(third).not.toHaveBeenCalled();
        });

        it("should terminate with `null` if no `true` value is reached", function () {
            expect(Lispy.interpret(['cond', ['F', 1], ['F', 2]])).toBeNull();
        });

        it("should terminate with `null` a non-truth value is used for a condition", function () {
            expect(Lispy.interpret(['cond', ['F', 1], [1, 2], ['T', 3]])).toBeNull();
        });

        it("should terminate with `true` if `true` value does not have any executable statement associated with it", function () {
            expect(Lispy.interpret(['cond', ['F', 1], ['T']])).toBe(true);
        });

        it("should terminate with the value of the statement for the `true` clause", function () {
            expect(Lispy.interpret(['cond', ['F', 1], ['T', 2]])).toBe(2);
        });

        it("should terminate with a list of values of all statements for the `true` clause", function () {
            expect(Lispy.interpret(['cond', ['F', 1], ['T', 2, 3, 4]])).toEqual([2, 3, 4]);
        });

    });

    describe("arithmetic operators", function () {

        it("should allow for summation using `+`", function () {
            var first = Math.random();
            var second = Math.random();
            var third = Math.random();
            expect(Lispy.interpret(['+', first, second, third])).toBe(first + second + third);
        });

        it("should allow for subtraction using `-`", function () {
            var first = Math.random();
            var second = Math.random();
            var third = Math.random();
            expect(Lispy.interpret(['-', first, second, third])).toBe(first - second - third);
        });

        it("should allow for multiplication using `*`", function () {
            var first = Math.random();
            var second = Math.random();
            var third = Math.random();
            expect(Lispy.interpret(['*', first, second, third])).toBe(first * second * third);
        });

        it("should allow for division using `/`", function () {
            var first = 1 + Math.random();
            var second = 1 + Math.random();
            var third = 1 + Math.random();
            expect(Lispy.interpret(['/', first, second, third])).toBe(first / second / third);
        });

    });

    describe("relative comparison", function () {

        it("should allow for equality check using `=`", function () {
            expect(Lispy.interpret(['=', 1, 1])).toBeTruthy();
            expect(Lispy.interpret(['=', 1, 2])).toBeFalsy();
        });

        it("should allow for inequality check using `!=`", function () {
            expect(Lispy.interpret(['!=', 1, 1])).toBeFalsy();
            expect(Lispy.interpret(['!=', 1, 2])).toBeTruthy();
        });

        it("should allow for greater weight check using `>`", function () {
            expect(Lispy.interpret(['>', 1, 1])).toBeFalsy();
            expect(Lispy.interpret(['>', 1, 2])).toBeFalsy();
            expect(Lispy.interpret(['>', 2, 1])).toBeTruthy();
        });

        it("should allow for less weight check using `<`", function () {
            expect(Lispy.interpret(['<', 1, 1])).toBeFalsy();
            expect(Lispy.interpret(['<', 1, 2])).toBeTruthy();
            expect(Lispy.interpret(['<', 2, 1])).toBeFalsy();
        });

        it("should allow for greater or equal weight check using `>=`", function () {
            expect(Lispy.interpret(['>=', 1, 1])).toBeTruthy();
            expect(Lispy.interpret(['>=', 1, 2])).toBeFalsy();
            expect(Lispy.interpret(['>=', 2, 1])).toBeTruthy();
        });

        it("should allow for less or equal weight check using `<=`", function () {
            expect(Lispy.interpret(['<=', 1, 1])).toBeTruthy();
            expect(Lispy.interpret(['<=', 1, 2])).toBeTruthy();
            expect(Lispy.interpret(['<=', 2, 1])).toBeFalsy();
        });

    });

    describe("`null?`", function () {

        it("should return `true` if no input is given", function () {
            expect(Lispy.interpret(['null?', undefined])).toBeTruthy();
        });

        it("should return `true` if the input is `null`", function () {
            expect(Lispy.interpret(['null?', null])).toBeTruthy();
        });

        it("should return `true` if the input is `undefined`", function () {
            expect(Lispy.interpret(['null?', undefined])).toBeTruthy();
        });

        it("should return `true` if the input is an empty list", function () {
            expect(Lispy.interpret(['null?', []])).toBeTruthy();
        });

        it("should return `false` for numbers", function () {
            expect(Lispy.interpret(['null?', 1])).toBeFalsy();
        });

        it("should return `false` for truth-values (i.e. `true` and `false`)", function () {
            expect(Lispy.interpret(['null?', true])).toBeFalsy();
            expect(Lispy.interpret(['null?', false])).toBeFalsy();
        });

        it("should return `false` for non-empty lists", function () {
            expect(Lispy.interpret(['null?', [1]])).toBeFalsy();
            expect(Lispy.interpret(['null?', [1, 2]])).toBeFalsy();
        });

    });

    describe("`atom?`", function () {

        it("should return `false` if no input is given", function () {
            expect(Lispy.interpret(['atom?', undefined])).toBeFalsy();
        });

        it("should return `false` if the input is `null`", function () {
            expect(Lispy.interpret(['atom?', null])).toBeFalsy();
        });

        it("should return `false` if the input is `undefined`", function () {
            expect(Lispy.interpret(['atom?', undefined])).toBeFalsy();
        });

        it("should return `false` if the input is an empty list", function () {
            expect(Lispy.interpret(['atom?', []])).toBeFalsy();
        });

        it("should return `true` for numbers", function () {
            expect(Lispy.interpret(['atom?', 1])).toBeTruthy();
        });

        it("should return `true` for truth-values (i.e. `true` and `false`)", function () {
            expect(Lispy.interpret(['atom?', true])).toBeTruthy();
            expect(Lispy.interpret(['atom?', false])).toBeTruthy();
        });

        it("should return `true` for non-empty lists", function () {
            expect(Lispy.interpret(['atom?', [1]])).toBeTruthy();
            expect(Lispy.interpret(['atom?', [1, 2]])).toBeTruthy();
        });

    });

    describe("`lambda`", function () {

        it("should return `null` if no argument list or body is given", function () {
            expect(Lispy.interpret(['lambda'])).toBeNull();
        });

        it("should return a function when a list of arguments and a body is present", function () {
            var interpretation = Lispy.interpret(['lambda', ['x'], 'x']);
            expect(interpretation).toBeDefined();
            expect(interpretation).not.toBeNull();
            expect(interpretation instanceof Function).toBeTruthy();
        });

        it("should define a function that return its last statement", function () {
            var interpretation = Lispy.interpret(['lambda', ['x'], 'x']);
            expect(interpretation).toBeDefined();
            expect(interpretation).not.toBeNull();
            expect(interpretation instanceof Function).toBeTruthy();
            var value = Math.random();
            expect(interpretation(value)).toBe(value);
        });

        it("should properly allow for recursion", function () {
            Lispy.interpret(['define', 'x', ['lambda', ['y'],
                ['cond',
                    [['null?', 'y'], 0],
                    ['T', ['+', 1, ['x', ['cdr', 'y']]]]
                ]
            ]]);
            expect(Lispy.interpret(['x', [1, 2, 3, 4, 5, 6]])).toBe(6);
        });

    });

    describe("`label`", function () {

        it("should return a function that resolves the value", function () {
            var value = Math.random();
            var interpretation = Lispy.interpret(['label', 'x', value]);
            expect(interpretation).toBeDefined();
            expect(interpretation).not.toBeNull();
            expect(interpretation instanceof Function).toBeTruthy();
            expect(interpretation()).toBe(value);
        });

        it("should allow for execution of lambda's within its scope when being interpreted", function () {
            var interpretation = Lispy.interpret(['label', 'x',
                ['lambda', ['y'], ['cond',
                    [['null?', 'y'], 0],
                    ['T', ['+', 1, [['x'], ['cdr', 'y']]]]
                ]]
            ]);
            window.int = interpretation;
            expect(true).toBeTruthy();
        });

    });

});