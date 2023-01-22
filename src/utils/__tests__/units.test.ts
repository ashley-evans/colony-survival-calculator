import { Units, isUnit } from "../units";

test("returns false if string provided is not a valid unit", () => {
    const invalidUnit = "test unit";

    const actual = isUnit(invalidUnit);

    expect(actual).toEqual(false);
});

test.each(Object.values(Units))(
    "returns true if %s unit provided",
    (unit: Units) => {
        const actual = isUnit(unit);

        expect(actual).toEqual(true);
    }
);
