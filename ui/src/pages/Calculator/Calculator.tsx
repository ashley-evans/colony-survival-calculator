import React, { useState } from "react";
import { useQuery } from "@apollo/client";

import ItemSelector from "./components/ItemSelector";
import WorkerInput from "./components/WorkerInput";
import OutputUnitSelector from "./components/OutputUnitSelector";
import Requirements from "./components/Requirements";
import ErrorBoundary from "./components/ErrorBoundary";
import { CalculatorContainer, CalculatorHeader } from "./styles";
import { OutputUnit, Tools } from "../../graphql/__generated__/graphql";
import OptimalOutput from "./components/OptimalOutput";
import { gql } from "../../graphql/__generated__";
import ToolSelector from "./components/ToolSelector";

const GET_ITEM_NAMES_QUERY = gql(`
    query GetItemNames {
        distinctItemNames
    }
`);

const GET_ITEM_DETAILS_QUERY = gql(`
    query GetItemDetails($filters: ItemsFilters!) {
        item(filters: $filters) {
            size {
                width
                height
            }
        }
    }
`);

function Calculator() {
    const [workers, setWorkers] = useState<number>();
    const [selectedTool, setSelectedTool] = useState<Tools>(Tools.None);
    const [selectedOutputUnit, setSelectedOutputUnit] = useState<OutputUnit>(
        OutputUnit.Minutes
    );

    const {
        loading: itemNamesLoading,
        data: itemNameData,
        error: itemNameError,
    } = useQuery(GET_ITEM_NAMES_QUERY);
    const [selectedItem, setSelectedItem] = useState<string>();
    const { data: itemDetailsData, error: itemDetailsError } = useQuery(
        GET_ITEM_DETAILS_QUERY,
        {
            variables: {
                filters: {
                    name: selectedItem,
                    optimal: { maxAvailableTool: selectedTool },
                },
            },
            skip: !selectedItem,
        }
    );

    if (itemNamesLoading) {
        return (
            <CalculatorContainer>
                <span>Loading items...</span>
            </CalculatorContainer>
        );
    }

    if (!selectedItem && itemNameData?.distinctItemNames[0]) {
        setSelectedItem(itemNameData.distinctItemNames[0]);
    }

    const networkError = itemNameError || itemDetailsError;

    return (
        <CalculatorContainer>
            <CalculatorHeader>Desired output:</CalculatorHeader>
            {itemNameData?.distinctItemNames &&
            itemNameData.distinctItemNames.length > 0 ? (
                <>
                    <ItemSelector
                        items={itemNameData.distinctItemNames}
                        onItemChange={setSelectedItem}
                    />
                    <WorkerInput onWorkerChange={setWorkers} />
                    <ToolSelector onToolChange={setSelectedTool} />
                    <OutputUnitSelector onUnitChange={setSelectedOutputUnit} />
                </>
            ) : null}
            <ErrorBoundary>
                <>
                    {itemDetailsData?.item[0]?.size ? (
                        <span>
                            Calculations use optimal farm size:{" "}
                            {itemDetailsData?.item[0].size.width} x{" "}
                            {itemDetailsData?.item[0].size.height}
                        </span>
                    ) : null}
                    {workers != undefined && selectedItem ? (
                        <OptimalOutput
                            itemName={selectedItem}
                            workers={workers}
                            outputUnit={selectedOutputUnit}
                            maxAvailableTool={selectedTool}
                        />
                    ) : null}
                    {workers && selectedItem ? (
                        <Requirements
                            selectedItemName={selectedItem}
                            workers={workers}
                            maxAvailableTool={selectedTool}
                        />
                    ) : null}
                </>
            </ErrorBoundary>
            {itemNameData?.distinctItemNames &&
            itemNameData.distinctItemNames.length < 1 ? (
                <span role="alert">Unable to fetch known items</span>
            ) : null}
            {networkError ? (
                <span role="alert">
                    An error occurred fetching item details, please refresh the
                    page and try again.
                </span>
            ) : null}
        </CalculatorContainer>
    );
}

export default Calculator;
