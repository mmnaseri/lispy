/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (5/28/15, 9:11 PM)
 */

describe("the interpreter", function () {

    beforeEach(function () {
        Lispy.reset();
    });

    it("should treat anything but an array as a `null`", function () {
        expect(Lispy.interpret()).toBeNull();
        expect(Lispy.interpret(null)).toBeNull();
        expect(Lispy.interpret(123)).toBeNull();
        expect(Lispy.interpret("abc")).toBeNull();
        expect(Lispy.interpret(true)).toBeNull();
        expect(Lispy.interpret(false)).toBeNull();
        expect(Lispy.interpret({})).toBeNull();
    });

    it("should treat an empty array as `null`", function () {
        expect(Lispy.interpret([])).toBeNull();
    });

    it("should treat a list starting with non-strings and non-functions as normal lists", function () {
        var list = [1, 2, 3];
        expect(Lispy.interpret(list)).toEqual(list);
    });

    it("should apply the rest of the arguments to the first item if it is a function", function () {
        var returnValue = Math.random();
        var first = Math.random();
        var second = Math.random() + first;
        var spy = jasmine.createSpy("first argument").and.callFake(function () {
            return returnValue;
        });
        expect(spy).not.toHaveBeenCalled();
        expect(Lispy.interpret([spy, first, second])).toBe(returnValue);
        expect(spy.calls.count()).toBe(1);
        expect(spy).toHaveBeenCalledWith(first, second);
    });

    it("should return the rest of the list if the function name is `quote`", function () {
        expect(Lispy.interpret(['quote', 1, 2, 3])).toEqual([1, 2, 3]);
        expect(Lispy.interpret(['quote'])).toBeNull();
    });

    it("should allow for custom handlers to be added via `Lispy.handle(fn, handler)`", function () {
        var value = Math.random();
        var first = Math.random();
        var second = Math.random();
        var spy = jasmine.createSpy("custom handler").and.callFake(function () {
            return value;
        });
        var fn = "myFunc";
        Lispy.handle(fn, spy);
        expect(spy).not.toHaveBeenCalled();
        expect(Lispy.interpret([fn, first, second])).toEqual(value);
        expect(spy.calls.count()).toBe(1);
        expect(spy).toHaveBeenCalledWith(first, second);
    });

    it("should allow for managing of arguments in a custom way via `Lispy.manage(fn, manager)`", function () {
        var manager = jasmine.createSpy("manager").and.callFake(function (a, b, c) {
            return [a * b, c];
        });
        var handler = jasmine.createSpy("handler").and.callFake(function (a, b) {
            return a + b;
        });
        var fn = 'myFunc';
        Lispy.handle(fn, handler);
        Lispy.manage(fn, manager);
        var first = Math.random();
        var second = Math.random();
        var third = Math.random();
        expect(manager).not.toHaveBeenCalled();
        expect(handler).not.toHaveBeenCalled();
        expect(Lispy.interpret([fn, first, second, third])).toBe(first * second + third);
        expect(manager.calls.count()).toBe(1);
        expect(handler.calls.count()).toBe(1);
        expect(manager).toHaveBeenCalledWith(first, second, third);
        expect(handler).toHaveBeenCalledWith(first * second, third);
    });

    it("should fold arguments if they are arrays", function () {
        var returnValue = Math.random();
        var spy = jasmine.createSpy("handler").and.callFake(function () {
            return returnValue;
        });
        var fn = "myFunc";
        Lispy.handle(fn, spy);
        Lispy.interpret([fn, [fn, 1]]);
        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(0)).toEqual([1]);
        expect(spy.calls.argsFor(1)).toEqual([returnValue]);
    });

    it("should allow for adding additional values into the local environment via the `addon` argument", function () {
        var random = Math.random();
        var value = Lispy.interpret(['quote', 'x'], {
            x: random
        });
        expect(value).toEqual([random]);
    });

    it("should map the first token to a function name in the environment if it is a string", function () {
        var random = Math.random();
        var spy = jasmine.createSpy("function");
        Lispy.interpret(['fn', random], {
            fn: spy
        });
        expect(spy).toHaveBeenCalledWith(random);
    });

});