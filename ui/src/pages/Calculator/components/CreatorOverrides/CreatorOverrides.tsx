import React from "react";
import { useQuery } from "@apollo/client";
import { faAdd } from "@fortawesome/free-solid-svg-icons";

import { gql } from "../../../../graphql/__generated__";
import { AddIcon, LargeAddButton, OverrideListContainer } from "./styles";

const GET_ITEMS_WITH_MULTIPLE_CREATORS = gql(`
    query GetMultipleCreatorDetails {
        item(filters: { minimumCreators: 2 }) {
            name
            creator
        }
    }
`);

function CreatorOverrides() {
    const { loading, data } = useQuery(GET_ITEMS_WITH_MULTIPLE_CREATORS);

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
                    <LargeAddButton>
                        <span>Add creator override</span>
                        <AddIcon icon={faAdd} />
                    </LargeAddButton>
                </OverrideListContainer>
            ) : null}
        </>
    );
}

export { CreatorOverrides };
