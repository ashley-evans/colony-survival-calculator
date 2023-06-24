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

const GET_ITEMS_WITH_MULTIPLE_CREATORS = gql(`
    query GetMultipleCreatorDetails {
        item(filters: { minimumCreators: 2 }) {
            name
            creator
        }
    }
`);

type CreatorMap = Map<string, string[]>;
type Overrides = { name: string; creators: string[] };

function groupByCreators(items: Pick<Item, "name" | "creator">[]): CreatorMap {
    return items.reduce((acc, { name, creator }) => {
        const creators = acc.get(name);
        acc.set(name, creators ? [...creators, creator] : [creator]);
        return acc;
    }, new Map<string, string[]>());
}

type CreatorOverrideProps = {
    availableOverrides: Overrides[];
    selectedOverrideCreators: string[];
    onRemove: () => void;
};

function CreatorOverride({
    availableOverrides,
    selectedOverrideCreators,
    onRemove,
}: CreatorOverrideProps) {
    return (
        <OverrideContainer>
            <Selector
                items={availableOverrides}
                itemToKey={(item) => item.name}
                itemToDisplayText={(item) => item.name}
                labelText="Item:"
                defaultSelectedItem={availableOverrides[0]}
            />
            <Selector
                items={selectedOverrideCreators}
                itemToKey={(creator) => creator}
                itemToDisplayText={(creator) => creator}
                labelText="Creator:"
                defaultSelectedItem={selectedOverrideCreators[0]}
            />
            <RemoveButtonContainer>
                <RemoveButton onClick={onRemove}>
                    <span>Remove</span>
                    <Icon icon={faRemove} />
                </RemoveButton>
            </RemoveButtonContainer>
        </OverrideContainer>
    );
}

function CreatorOverrides() {
    const { loading, data } = useQuery(GET_ITEMS_WITH_MULTIPLE_CREATORS);
    const [availableOverrides, setAvailableOverrides] = useState<Overrides[]>(
        []
    );
    const [activeOverrides, setActiveOverrides] = useState<Overrides[]>([]);

    useEffect(() => {
        if (data?.item) {
            const groupedItems = groupByCreators(data.item);
            const overrides: Overrides[] = Array.from(
                groupedItems.entries()
            ).map(([name, creators]) => ({ name, creators }));
            setAvailableOverrides(overrides);
        }
    }, [data]);

    const overrideCanBeAdded = () => {
        return (
            availableOverrides.length !== 0 &&
            activeOverrides.length !== availableOverrides.length
        );
    };

    const addOverride = () => {
        if (!overrideCanBeAdded()) {
            return;
        }

        const override = availableOverrides[0];
        setActiveOverrides([...activeOverrides, override]);
    };

    const removeOverride = () => {
        setActiveOverrides([]);
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
                    {overrideCanBeAdded() ? (
                        <LargeAddButton onClick={addOverride}>
                            <span>Add creator override</span>
                            <Icon icon={faAdd} />
                        </LargeAddButton>
                    ) : null}
                    {activeOverrides.length > 0 ? (
                        <CreatorOverride
                            availableOverrides={activeOverrides}
                            selectedOverrideCreators={
                                activeOverrides[0].creators
                            }
                            onRemove={removeOverride}
                        />
                    ) : null}
                </OverrideListContainer>
            ) : null}
        </>
    );
}

export { CreatorOverrides };
