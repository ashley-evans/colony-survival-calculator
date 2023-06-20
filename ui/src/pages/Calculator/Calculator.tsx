import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import ItemSelector from "./components/ItemSelector";
import WorkerInput from "./components/WorkerInput";
import OutputUnitSelector from "./components/OutputUnitSelector";
import Requirements from "./components/Requirements";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageContainer, TabContainer, TabHeader, Tabs } from "./styles";
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

type StateProp<S> = ReturnType<typeof useState<S>>;

type CalculatorTabProps = {
    selectedItem: StateProp<string>;
    workers: StateProp<number>;
};

function CalculatorTab({
    selectedItem: [selectedItem, setSelectedItem],
    workers: [workers, setWorkers],
}: CalculatorTabProps) {
    const [selectedTool, setSelectedTool] = useState<Tools>(Tools.None);
    const [selectedOutputUnit, setSelectedOutputUnit] = useState<OutputUnit>(
        OutputUnit.Minutes
    );

    const {
        loading: itemNamesLoading,
        data: itemNameData,
        error: itemNameError,
    } = useQuery(GET_ITEM_NAMES_QUERY);
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

    useEffect(() => {
        if (!selectedItem && itemNameData?.distinctItemNames[0]) {
            setSelectedItem(itemNameData.distinctItemNames[0]);
        }
    }, [selectedItem, itemNameData]);

    if (itemNamesLoading) {
        return (
            <PageContainer>
                <span>Loading items...</span>
            </PageContainer>
        );
    }

    const networkError = itemNameError || itemDetailsError;

    return (
        <>
            <TabHeader>Desired output:</TabHeader>
            {itemNameData?.distinctItemNames &&
            itemNameData.distinctItemNames.length > 0 ? (
                <>
                    <ItemSelector
                        items={itemNameData.distinctItemNames}
                        onItemChange={setSelectedItem}
                        defaultSelectedItem={selectedItem}
                    />
                    <WorkerInput
                        onWorkerChange={setWorkers}
                        defaultWorkers={workers}
                    />
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
        </>
    );
}

function SettingsTab() {
    return <TabHeader>Overrides:</TabHeader>;
}

enum PageTabs {
    CALCULATOR = "calculator",
    SETTINGS = "settings",
}

function Calculator() {
    const [selectedTab, setSelectedTab] = useState<PageTabs>(
        PageTabs.CALCULATOR
    );

    const selectedItemState = useState<string>();
    const workersState = useState<number>();

    return (
        <PageContainer>
            <Tabs role="tablist">
                <button
                    role="tab"
                    aria-selected={selectedTab === PageTabs.CALCULATOR}
                    tabIndex={selectedTab === PageTabs.CALCULATOR ? 0 : -1}
                    onClick={() => setSelectedTab(PageTabs.CALCULATOR)}
                >
                    Calculator
                </button>
                <button
                    role="tab"
                    aria-selected={selectedTab === PageTabs.SETTINGS}
                    tabIndex={selectedTab === PageTabs.SETTINGS ? 0 : -1}
                    onClick={() => setSelectedTab(PageTabs.SETTINGS)}
                >
                    Settings
                </button>
            </Tabs>
            <TabContainer role="tabpanel">
                {selectedTab === PageTabs.CALCULATOR ? (
                    <CalculatorTab
                        selectedItem={selectedItemState}
                        workers={workersState}
                    />
                ) : null}
                {selectedTab === PageTabs.SETTINGS ? <SettingsTab /> : null}
            </TabContainer>
        </PageContainer>
    );
}

export default Calculator;
