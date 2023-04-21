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
        item {
            name
        }
    }
`);

const GET_ITEM_DETAILS_QUERY = gql(`
    query GetItemDetails($name: ID!) {
        item(name: $name) {
            size {
                width
                height
            }
        }
    }
`);

function Calculator() {
    const {
        loading: itemNamesLoading,
        data: itemNameData,
        error: itemNameError,
    } = useQuery(GET_ITEM_NAMES_QUERY);
    const [selectedItem, setSelectedItem] = useState<string>();
    const { data: itemDetailsData, error: itemDetailsError } = useQuery(
        GET_ITEM_DETAILS_QUERY,
        {
            variables: { name: selectedItem ?? "" },
            skip: !selectedItem,
        }
    );

    const [workers, setWorkers] = useState<number>();
    const [selectedTool, setSelectedTool] = useState<Tools>();
    const [selectedOutputUnit, setSelectedOutputUnit] = useState<OutputUnit>(
        OutputUnit.Minutes
    );

    if (itemNamesLoading) {
        return (
            <CalculatorContainer>
                <span>Loading items...</span>
            </CalculatorContainer>
        );
    }

    if (!selectedItem && itemNameData?.item[0]) {
        setSelectedItem(itemNameData.item[0].name);
    }

    const networkError = itemNameError || itemDetailsError;

    return (
        <CalculatorContainer>
            <CalculatorHeader>Desired output:</CalculatorHeader>
            {itemNameData?.item && itemNameData.item.length > 0 ? (
                <>
                    <ItemSelector
                        items={itemNameData.item}
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
                        />
                    ) : null}
                </>
            </ErrorBoundary>
            {itemNameData?.item && itemNameData.item.length < 1 ? (
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
