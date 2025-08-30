import { Requirement } from "../../../../../../graphql/__generated__/graphql";

export type TreeNode<T> = T & { children: TreeNode<T>[]; depth: number };

const UNKNOWN_ROOT_ITEM_ERROR = "Unknown item required with name: ";

type FlatRequirement = Omit<Requirement, "creators" | "__typename">;
export type RequirementTreeNode = TreeNode<FlatRequirement>;

const flattenDemands = (requirement: Requirement): FlatRequirement[] => {
    const demandMap = new Map<string, number>();
    for (const creator of requirement.creators) {
        for (const demand of creator.demands) {
            const existingDemand = demandMap.get(demand.name) ?? 0;
            demandMap.set(demand.name, existingDemand + demand.amount);
        }
    }

    return Array.from(demandMap.entries()).map(([name, amount]) => ({
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
        requirements.map((requirement) => [requirement.name, requirement]),
    );

const createTree = (
    requirements: Requirement[],
    rootItemName: string,
): RequirementTreeNode => {
    const map = createRequirementMap(requirements);

    const createNode = (
        requirementName: string,
        depth: number,
        amount?: number,
    ): RequirementTreeNode => {
        const requirement = map.get(requirementName);
        if (!requirement) {
            throw new Error(`${UNKNOWN_ROOT_ITEM_ERROR}${requirementName}`);
        }

        const demands = flattenDemands(requirement);
        const children = demands.map((demand) =>
            createNode(demand.name, depth + 1, demand.amount),
        );

        return convertRequirementToNode(
            { name: requirement.name, amount: amount ?? requirement.amount },
            children,
            depth,
        );
    };

    return createNode(rootItemName, 0);
};

export { createTree };
