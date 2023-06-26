import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { faAdd, faRemove } from "@fortawesome/free-solid-svg-icons";

import { gql } from "../../../../graphql/__generated__";
import {
    Icon,
    LargeAddButton,
    OverrideContainer,
    OverrideListContainer,
    RemoveButton,
    RemoveButtonContainer,
} from "./styles";
import { Selector } from "../../../../common";
import { Item } from "../../../../graphql/__generated__/graphql";

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

type CreatorOverrideProps = {
    creatorMap: CreatorMap;
    allOverrides: string[];
    activeOverrides: Set<string>;
    defaultOverride: string;
    onSelectedItemChange: (newItem: string, oldItem: string) => void;
    onRemove: (selectedItem: string) => void;
};

function CreatorOverride({
    creatorMap,
    allOverrides,
    activeOverrides,
    defaultOverride,
    onSelectedItemChange,
    onRemove,
}: CreatorOverrideProps) {
    const [selectedItem, setSelectedItem] = useState<string>(defaultOverride);
    const availableOverrides = allOverrides.filter(
        (override) => !activeOverrides.has(override) || override == selectedItem
    );

    const selectedItemCreators = creatorMap.get(selectedItem);
    if (!selectedItemCreators) {
        throw new Error(UNHANDLED_EXCEPTION);
    }

    const handleSelectedItemChange = (value?: string) => {
        if (!value) {
            return;
        }

        const oldItem = selectedItem;
        setSelectedItem(value);
        onSelectedItemChange(value, oldItem);
    };

    const handleRemove = () => {
        onRemove(selectedItem);
    };

    return (
        <OverrideContainer>
            <Selector
                items={availableOverrides}
                itemToKey={(name) => name}
                itemToDisplayText={(name) => name}
                labelText="Item:"
                defaultSelectedItem={selectedItem}
                onSelectedItemChange={handleSelectedItemChange}
            />
            <Selector
                items={selectedItemCreators}
                itemToKey={(creator) => creator}
                itemToDisplayText={(creator) => creator}
                labelText="Creator:"
                defaultSelectedItem={selectedItemCreators[0]}
            />
            <RemoveButtonContainer>
                <RemoveButton onClick={handleRemove}>
                    <span>Remove</span>
                    <Icon icon={faRemove} />
                </RemoveButton>
            </RemoveButtonContainer>
        </OverrideContainer>
    );
}

function CreatorOverrides() {
    const { loading, data } = useQuery(GET_ITEMS_WITH_MULTIPLE_CREATORS);
    const [creatorMap, setCreatorMap] = useState<CreatorMap>(new Map());

    const [allOverrides, setAllOverrides] = useState<string[]>([]);
    const [activeOverrides, setActiveOverrides] = useState<Set<string>>(
        new Set()
    );

    useEffect(() => {
        if (data?.item) {
            const groupedItems = groupByCreators(data.item);
            const items = Array.from(groupedItems.entries()).map(
                ([name]) => name
            );
            setAllOverrides(items);
            setCreatorMap(groupedItems);
        }
    }, [data]);

    const overrideCanBeAdded = () => {
        return (
            allOverrides.length !== 0 &&
            activeOverrides.size !== allOverrides.length
        );
    };

    const addOverride = () => {
        if (!overrideCanBeAdded()) {
            return;
        }

        const availableOverrides = allOverrides.filter(
            (override) => !activeOverrides.has(override)
        );
        const newActiveOverrides = new Set(activeOverrides);
        newActiveOverrides.add(availableOverrides[0]);
        setActiveOverrides(newActiveOverrides);
    };

    const removeOverride = (item: string) => {
        const newActiveOverrides = new Set(activeOverrides);
        newActiveOverrides.delete(item);
        setActiveOverrides(newActiveOverrides);
    };

    const handleActiveOverrideChange = (newItem: string, oldItem: string) => {
        const newActiveOverrides = new Set(activeOverrides);
        newActiveOverrides.delete(oldItem);
        newActiveOverrides.add(newItem);
        setActiveOverrides(newActiveOverrides);
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
                    {Array.from(activeOverrides.values()).map((override) => (
                        <CreatorOverride
                            key={override}
                            creatorMap={creatorMap}
                            allOverrides={allOverrides}
                            activeOverrides={activeOverrides}
                            defaultOverride={override}
                            onSelectedItemChange={handleActiveOverrideChange}
                            onRemove={removeOverride}
                        />
                    ))}
                    {overrideCanBeAdded() ? (
                        <LargeAddButton onClick={addOverride}>
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
