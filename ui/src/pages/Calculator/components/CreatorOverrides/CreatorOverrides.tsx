import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { faAdd } from "@fortawesome/free-solid-svg-icons";

import { gql } from "../../../../graphql/__generated__";
import {
    AddIcon,
    LargeAddButton,
    OverrideContainer,
    OverrideListContainer,
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

function CreatorOverrides() {
    const { loading, data } = useQuery(GET_ITEMS_WITH_MULTIPLE_CREATORS);
    const [itemCreatorMap, setItemCreatorMap] = useState<CreatorMap>(new Map());
    const [overrides, setOverrides] = useState<Overrides[]>([]);

    useEffect(() => {
        if (data?.item) {
            setItemCreatorMap(groupByCreators(data.item));
        }
    }, [data]);

    const addOverride = () => {
        const groupedItems = Array.from(itemCreatorMap.keys());
        if (groupedItems.length === 0) {
            return;
        }

        const item = groupedItems[0];
        const creators = itemCreatorMap.get(item);
        if (!creators) {
            return;
        }

        setOverrides([{ name: item, creators }]);
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
                    <LargeAddButton onClick={addOverride}>
                        <span>Add creator override</span>
                        <AddIcon icon={faAdd} />
                    </LargeAddButton>
                    {overrides.length > 0 ? (
                        <OverrideContainer>
                            <Selector
                                items={overrides}
                                itemToKey={(item) => item.name}
                                itemToDisplayText={(item) => item.name}
                                labelText="Item:"
                                defaultSelectedItem={overrides[0]}
                            />
                            <Selector
                                items={overrides[0].creators}
                                itemToKey={(creator) => creator}
                                itemToDisplayText={(creator) => creator}
                                labelText="Creator:"
                                defaultSelectedItem={overrides[0].creators[0]}
                            />
                        </OverrideContainer>
                    ) : null}
                </OverrideListContainer>
            ) : null}
        </>
    );
}

export { CreatorOverrides };
