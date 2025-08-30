import { Items } from "../types";

type FilterByConditionResult<T> = { matching: T[]; nonMatching: T[] };

const filterByCondition = <T>(
    array: T[],
    condition: (item: T) => boolean,
): FilterByConditionResult<T> =>
    array.reduce(
        (acc, current) => {
            if (condition(current)) {
                acc.matching.push(current);
            } else {
                acc.nonMatching.push(current);
            }

            return acc;
        },
        { matching: [], nonMatching: [] } as FilterByConditionResult<T>,
    );

const splitPiplizCreator = (creator: string): string => {
    const [, parsed] = creator.split(".");
    if (!parsed) {
        throw new Error(
            `Unknown format of pipliz creator provided: ${creator}`,
        );
    }

    return parsed;
};

const splitPiplizName = (
    name: string,
): { itemName: string; creator: string } => {
    const [, creator, itemName] = name.split(".");
    if (!creator || !itemName) {
        throw new Error(`Unknown format of pipliz name provided: ${name}`);
    }

    return { itemName, creator };
};

const checkDuplication = (
    items: Items,
):
    | { duplicateFound: true; name: string; creator: string }
    | { duplicateFound: false } => {
    const existingSet = new Set<string>();
    for (const { name, creator } of items) {
        const hash = JSON.stringify({ name, creator });
        if (existingSet.has(hash)) {
            return { duplicateFound: true, name, creator };
        }

        existingSet.add(hash);
    }

    return { duplicateFound: false };
};

export {
    filterByCondition,
    splitPiplizCreator,
    splitPiplizName,
    checkDuplication,
};
