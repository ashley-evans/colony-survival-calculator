import { Requirement } from "../../../../../../graphql/__generated__/graphql";

export type TreeNode<T> = T & { children: TreeNode<T>[]; depth: number };

const UNKNOWN_ROOT_ITEM_ERROR = "Unknown item required with ID: ";

type FlatRequirement = Omit<Requirement, "creators" | "__typename" | "id">;
type FlattenedDemand = FlatRequirement & { id: string };
export type RequirementTreeNode = TreeNode<FlatRequirement>;

const flattenDemands = (requirement: Requirement): FlattenedDemand[] => {
    const demandMap = new Map<string, [string, number]>();
    for (const creator of requirement.creators) {
        for (const demand of creator.demands) {
            const existingDemand = demandMap.get(demand.id) ?? [demand.name, 0];
            demandMap.set(demand.id, [
                demand.name,
                existingDemand[1] + demand.amount,
            ]);
        }
    }

    return Array.from(demandMap.entries()).map(([id, [name, amount]]) => ({
        id,
        name,
        amount,
    }));
};

const convertRequirementToNode = (
    { name, amount }: Pick<Requirement, "name" | "amount">,
    children: RequirementTreeNode[] = [],
    depth = 0,
): RequirementTreeNode => ({ name, amount, children, depth });

const createRequirementMap = (requirements: Requirement[]) =>
    new Map<string, Requirement>(
        requirements.map((requirement) => [requirement.id, requirement]),
    );

const createTree = (
    requirements: Requirement[],
    rootItemID: string,
): RequirementTreeNode => {
    const map = createRequirementMap(requirements);

    const createNode = (
        requirementID: string,
        depth: number,
        amount?: number,
    ): RequirementTreeNode => {
        const requirement = map.get(requirementID);
        if (!requirement) {
            throw new Error(`${UNKNOWN_ROOT_ITEM_ERROR}${requirementID}`);
        }

        const demands = flattenDemands(requirement);
        const children = demands.map((demand) =>
            createNode(demand.id, depth + 1, demand.amount),
        );

        return convertRequirementToNode(
            {
                name: requirement.name,
                amount: amount ?? requirement.amount,
            },
            children,
            depth,
        );
    };

    return createNode(rootItemID, 0);
};

export { createTree };
