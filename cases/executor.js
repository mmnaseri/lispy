/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (6/1/15, 12:55 PM)
 */
describe("the executor", function () {

    it("should return `[]` for an empty string", function () {
        expect(Lispy.execute("")).toEqual([]);
    });

    it("should take a text and return a list of values that correspond to the result of the expressions therein", function () {
        expect(Lispy.execute("(define x 1) (define x (+ x 1)) (val x)")).toEqual([1, 2, 2]);
    });

    it("should fail with interpretation errors on a fail-fast basis", function () {
        expect(Lispy.execute.bind(null, "(define x (x))")).toThrow();
    });

    it("should fail with parse errors on a fail-last basis", function () {
        expect(Lispy.execute.bind(null, "(define x 1) (")).toThrow();
        expect(Lispy.interpret(['val', 'x'])).toBe(1);
    });

});