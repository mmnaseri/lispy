/**
 * @author Mohammad Milad Naseri (m.m.naseri@gmail.com)
 * @since 1.0 (5/29/15, 9:07 AM)
 */

describe("The core of the language", function () {

    beforeEach(function () {
        Lispy.reset();
    });

    it("should include atoms 'T' and 'F'", function () {
        expect(Lispy.interpret(['val', 'T'])).toEqual(true);
        expect(Lispy.interpret(['val', 'F'])).toEqual(false);
    });

});