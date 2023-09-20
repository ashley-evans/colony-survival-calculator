import { Requirement } from "../../../../../../../graphql/__generated__/graphql";
import {
    createCreatorDemands,
    createRequirement,
    createRequirementCreator,
} from "../../../../../__tests__/utils";
import { createTree } from "../utils";

const requirementWithSingleCreatorNoDemands: Requirement = createRequirement({
    name: "Item 1",
    amount: 30,
    creators: [
        createRequirementCreator({
            recipeName: "Item 1",
            amount: 30,
            workers: 20,
        }),
    ],
});

describe("requirements tree creation", () => {
    test("returns root node with no children", () => {
        const actual = createTree(
            [requirementWithSingleCreatorNoDemands],
            requirementWithSingleCreatorNoDemands.name
        );

        expect(actual).toEqual({
            name: requirementWithSingleCreatorNoDemands.name,
            amount: requirementWithSingleCreatorNoDemands.amount,
            depth: 0,
            children: [],
        });
    });

    test("returns root node with single child", () => {
        const requirementsSingleDemand: Requirement[] = [
            createRequirement({
                name: "Item 1",
                amount: 30,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 1",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 2", 12)],
                    }),
                ],
            }),
            createRequirement({
                name: "Item 2",
                amount: 12,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 2",
                        amount: 12,
                        workers: 20,
                    }),
                ],
            }),
        ];
        const actual = createTree(
            requirementsSingleDemand,
            requirementsSingleDemand[0].name
        );

        expect(actual).toEqual({
            name: requirementsSingleDemand[0].name,
            amount: requirementsSingleDemand[0].amount,
            children: expect.arrayContaining([
                {
                    name: requirementsSingleDemand[1].name,
                    amount: requirementsSingleDemand[1].amount,
                    children: [],
                    depth: 1,
                },
            ]),
            depth: 0,
        });
    });

    test("throws an error if provided a root item name that does not exist", () => {
        expect(() =>
            createTree([requirementWithSingleCreatorNoDemands], "unknown item")
        ).toThrowError("Unknown item required with name: unknown item");
    });

    test("combines multiple demands for the same requirement from multiple creators into one", () => {
        const requirementsSingleDemand: Requirement[] = [
            createRequirement({
                name: "Item 1",
                amount: 30,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 1",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 2", 12)],
                        creator: "Item 1 - Creator 1",
                    }),
                    createRequirementCreator({
                        recipeName: "Item 2",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 2", 25)],
                        creator: "Item 1 - Creator 2",
                    }),
                ],
            }),
            createRequirement({
                name: "Item 2",
                amount: 37,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 2",
                        amount: 37,
                        workers: 20,
                    }),
                ],
            }),
        ];
        const actual = createTree(
            requirementsSingleDemand,
            requirementsSingleDemand[0].name
        );

        expect(actual).toEqual({
            name: requirementsSingleDemand[0].name,
            amount: requirementsSingleDemand[0].amount,
            children: expect.arrayContaining([
                {
                    name: requirementsSingleDemand[1].name,
                    amount: requirementsSingleDemand[1].amount,
                    children: [],
                    depth: 1,
                },
            ]),
            depth: 0,
        });
    });

    test("returns nested children with correct depth if nested requirement", () => {
        const requirementsNestedDemand: Requirement[] = [
            createRequirement({
                name: "Item 1",
                amount: 30,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 1",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 2", 12)],
                    }),
                ],
            }),
            createRequirement({
                name: "Item 2",
                amount: 12,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 2",
                        amount: 12,
                        workers: 20,
                        demands: [createCreatorDemands("Item 3", 25)],
                    }),
                ],
            }),
            createRequirement({
                name: "Item 3",
                amount: 25,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 3",
                        amount: 25,
                        workers: 12,
                    }),
                ],
            }),
        ];
        const actual = createTree(
            requirementsNestedDemand,
            requirementsNestedDemand[0].name
        );

        expect(actual).toEqual({
            name: requirementsNestedDemand[0].name,
            amount: requirementsNestedDemand[0].amount,
            children: expect.arrayContaining([
                {
                    name: requirementsNestedDemand[1].name,
                    amount: requirementsNestedDemand[1].amount,
                    children: expect.arrayContaining([
                        {
                            name: requirementsNestedDemand[2].name,
                            amount: requirementsNestedDemand[2].amount,
                            children: [],
                            depth: 2,
                        },
                    ]),
                    depth: 1,
                },
            ]),
            depth: 0,
        });
    });

    test("throws an error if an item requires on a nested item that does not exist", () => {
        const requirementsNestedDemand: Requirement[] = [
            createRequirement({
                name: "Item 1",
                amount: 30,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 1",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 2", 12)],
                    }),
                ],
            }),
            createRequirement({
                name: "Item 2",
                amount: 12,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 2",
                        amount: 12,
                        workers: 20,
                        demands: [createCreatorDemands("Item 3", 25)],
                    }),
                ],
            }),
        ];

        expect(() =>
            createTree(
                requirementsNestedDemand,
                requirementsNestedDemand[0].name
            )
        ).toThrowError("Unknown item required with name: Item 3");
    });

    test("returns split demanded amounts if more than one item depends on same thing", () => {
        const requirementsNestedSplitDemand: Requirement[] = [
            createRequirement({
                name: "Item 1",
                amount: 60,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 1",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 2", 12)],
                    }),
                    createRequirementCreator({
                        recipeName: "Item 1",
                        amount: 30,
                        workers: 20,
                        demands: [createCreatorDemands("Item 3", 6)],
                    }),
                ],
            }),
            createRequirement({
                name: "Item 2",
                amount: 12,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 2",
                        amount: 12,
                        workers: 20,
                        demands: [createCreatorDemands("Item 3", 25)],
                    }),
                ],
            }),
            createRequirement({
                name: "Item 3",
                amount: 31,
                creators: [
                    createRequirementCreator({
                        recipeName: "Item 3",
                        amount: 31,
                        workers: 12,
                    }),
                ],
            }),
        ];

        const actual = createTree(
            requirementsNestedSplitDemand,
            requirementsNestedSplitDemand[0].name
        );

        expect(actual).toEqual({
            name: requirementsNestedSplitDemand[0].name,
            amount: requirementsNestedSplitDemand[0].amount,
            children: expect.arrayContaining([
                {
                    name: requirementsNestedSplitDemand[1].name,
                    amount: requirementsNestedSplitDemand[1].amount,
                    children: expect.arrayContaining([
                        {
                            name: requirementsNestedSplitDemand[2].name,
                            amount: 25,
                            children: [],
                            depth: 2,
                        },
                    ]),
                    depth: 1,
                },
                {
                    name: requirementsNestedSplitDemand[2].name,
                    amount: 6,
                    children: [],
                    depth: 1,
                },
            ]),
            depth: 0,
        });
    });
});
