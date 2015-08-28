/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/1/15, 12:08 PM)
 */
describe("the parser", function () {

    it("should map non-string args to `null`", function () {
        expect(Lispy.parse("")).toBeNull();
    });

    it("should map the empty string to `null`", function () {
        expect(Lispy.parse("")).toBeNull();
    });

    it("should map the whitespace-only strings to `null`", function () {
        expect(Lispy.parse("  ")).toBeNull();
    });

    it("should give an error when seeing a closing parenthesis without an opening", function () {
        expect(Lispy.parse.bind(null, ")")).toThrow();
    });

    it("should give an error when ending with an open parenthesis", function () {
        expect(Lispy.parse.bind(null, "(")).toThrow();
    });

    it("should give an error when a statement does not open with '('", function () {
        expect(Lispy.parse.bind(null, "a")).toThrow();
    });

    it("should return an instruction object which contains the result in `current()` and the next instruction in `next()`", function () {
        var instruction = Lispy.parse("()");
        expect(instruction).toBeDefined();
        expect(instruction).not.toBeNull();
        expect(instruction.current).toBeDefined();
        expect(instruction.current instanceof Function).toBeTruthy();
        expect(instruction.next).toBeDefined();
        expect(instruction.next instanceof Function).toBeTruthy();
    });

    it("should map parenthesis lists to arrays", function () {
        var instruction = Lispy.parse("()");
        expect(instruction.current()).toEqual([]);
    });

    it("should honor parenthesized lists", function () {
        var instruction = Lispy.parse("(()())");
        expect(instruction.current()).toEqual([[], []]);
    });

    it("should read tokens without evaluating them", function () {
        expect(Lispy.parse("(a b c)").current()).toEqual(['a', 'b', 'c']);
    });

    it("should honor tokens enclosed in double quotes as a single token", function () {
        expect(Lispy.parse('("a b" 1)').current()).toEqual([['str', 'a b'], 1]);
    });

    it("should lazily evaluate the next expression when needed", function () {
        var instruction = Lispy.parse("()(");
        expect(instruction.current()).toEqual([]);
        expect(instruction.next).toThrow();
    });

});