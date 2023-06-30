import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { faAdd } from "@fortawesome/free-solid-svg-icons";

import { gql } from "../../../../graphql/__generated__";
import { Icon, LargeAddButton, OverrideListContainer } from "./styles";
import {
    CreatorOverride,
    Item,
} from "../../../../graphql/__generated__/graphql";
import { CreatorOverrideSelector } from "./CreatorOverrideSelector";

const UNHANDLED_EXCEPTION =
    "Something went wrong, please refresh and try again.";

const GET_ITEMS_WITH_MULTIPLE_CREATORS = gql(`
    query GetMultipleCreatorDetails {
        item(filters: { minimumCreators: 2 }) {
            name
            creator
        }
    }
`);

type CreatorMap = Map<string, string[]>;

function groupByCreators(items: Pick<Item, "name" | "creator">[]): CreatorMap {
    return items.reduce((acc, { name, creator }) => {
        const creators = acc.get(name);
        acc.set(name, creators ? [...creators, creator] : [creator]);
        return acc;
    }, new Map<string, string[]>());
}

type CreatorOverridesProps = {
    defaultOverrides: CreatorOverride[];
    onOverridesUpdate: (overrides: CreatorOverride[]) => void;
};

function CreatorOverrides({
    defaultOverrides,
    onOverridesUpdate,
}: CreatorOverridesProps) {
    const { loading, data } = useQuery(GET_ITEMS_WITH_MULTIPLE_CREATORS);
    const [creatorMap, setCreatorMap] = useState<CreatorMap>(new Map());

    const [allItems, setAllItems] = useState<string[]>([]);
    const [activeOverrides, setActiveOverrides] = useState<Map<string, string>>(
        new Map()
    );

    useEffect(() => {
        if (data?.item) {
            const groupedItems = groupByCreators(data.item);
            const items = Array.from(groupedItems.keys()).map((name) => name);
            setAllItems(items);
            setCreatorMap(groupedItems);
        }

        if (defaultOverrides) {
            const active = new Map(
                defaultOverrides.map(({ itemName, creator }) => [
                    itemName,
                    creator,
                ])
            );
            setActiveOverrides(active);
        }
    }, [data]);

    useEffect(() => {
        const overrides: CreatorOverride[] = Array.from(
            activeOverrides.entries()
        ).map(([itemName, creator]) => ({ itemName, creator }));
        onOverridesUpdate(overrides);
    }, [activeOverrides]);

    const canOverrideBeAdded = () => activeOverrides.size !== allItems.length;

    const getItemCreators = (item: string): string[] => {
        const creators = creatorMap.get(item);
        if (!creators) {
            throw new Error(UNHANDLED_EXCEPTION);
        }

        return creators;
    };

    const getNextOverride = (): [string, string[]] => {
        const availableItems = allItems.filter(
            (override) => !activeOverrides.has(override)
        );

        const nextItem = availableItems[0];
        return [nextItem, getItemCreators(nextItem)];
    };

    const setOverride = (item: string, creator: string) => {
        const active = new Map(activeOverrides);
        active.set(item, creator);
        setActiveOverrides(active);
    };

    const removeOverride = (item: string) => {
        const active = new Map(activeOverrides);
        active.delete(item);
        setActiveOverrides(active);
    };

    const handleOverrideItemChange = (newItem: string, oldItem: string) => {
        const newItemCreators = getItemCreators(newItem);
        const active = new Map(activeOverrides);
        active.set(newItem, newItemCreators[0]);
        active.delete(oldItem);
        setActiveOverrides(active);
    };

    return (
        <>
            <span>
                By default, the calculator will use the recipe with the highest
                output per second unless an override is applied.
            </span>
            {loading ? <span>Loading overrides...</span> : null}
            {!loading && data?.item.length === 0 ? (
                <span role="alert">No overrides available</span>
            ) : null}
            {data && data.item.length > 0 ? (
                <OverrideListContainer>
                    {Array.from(activeOverrides.entries()).map(
                        ([item, creator]) => (
                            <CreatorOverrideSelector
                                key={item}
                                items={allItems.filter(
                                    (override) =>
                                        !activeOverrides.has(override) ||
                                        override === item
                                )}
                                creators={getItemCreators(item)}
                                defaultOverride={{
                                    itemName: item,
                                    creator: creator,
                                }}
                                onSelectedItemChange={handleOverrideItemChange}
                                onSelectedCreatorChange={setOverride}
                                onRemove={removeOverride}
                            />
                        )
                    )}
                    {canOverrideBeAdded() ? (
                        <LargeAddButton
                            onClick={() => {
                                const [item, creators] = getNextOverride();
                                setOverride(item, creators[0]);
                            }}
                        >
                            <span>Add creator override</span>
                            <Icon icon={faAdd} />
                        </LargeAddButton>
                    ) : null}
                </OverrideListContainer>
            ) : null}
        </>
    );
}

export { CreatorOverrides };
