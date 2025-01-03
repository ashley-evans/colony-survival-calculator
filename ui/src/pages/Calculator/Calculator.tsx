import React, { useState, Suspense, lazy } from "react";
import { useQuery } from "@apollo/client";

import ItemSelector from "./components/ItemSelector";
import OutputUnitSelector from "./components/OutputUnitSelector";
import ErrorBoundary from "./components/ErrorBoundary";
import {
    DefaultToolSelector,
    MachineToolCheckbox,
    PageContainer,
    TabContainer,
    TabHeader,
    Tabs,
} from "./styles";
import {
    AvailableTools,
    CreatorOverride,
    ItemsFilters,
    OutputUnit,
} from "../../graphql/__generated__/graphql";
import { gql } from "../../graphql/__generated__";
import CreatorOverrides from "./components/CreatorOverrides";
import TargetInput, { Target } from "./components/TargetInput";

const Output = lazy(() => import("./components/Output"));

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

type StateProp<S> = [S, (value: S) => void];

type CalculatorTabProps = {
    itemState: StateProp<string | undefined>;
    currentTarget: StateProp<Target | undefined>;
    toolState: StateProp<AvailableTools>;
    machineToolState: StateProp<boolean>;
    outputUnitState: StateProp<OutputUnit>;
    selectedCreatorOverrides: CreatorOverride[];
};

function getItemDetailsFilters(
    item?: string,
    tool?: AvailableTools,
    hasMachineTools?: boolean,
    overrides?: CreatorOverride[]
): ItemsFilters {
    const creator = overrides
        ? overrides.find(({ itemName }) => item == itemName)?.creator
        : undefined;
    return creator
        ? { name: item, creator }
        : { name: item, optimal: { maxAvailableTool: tool, hasMachineTools } };
}

function CalculatorTab({
    itemState: [selectedItem, setSelectedItem],
    currentTarget: [target, setTarget],
    toolState: [selectedTool, setSelectedTool],
    machineToolState: [hasMachineTools, setHasMachineTools],
    outputUnitState: [selectedOutputUnit, setSelectedOutputUnit],
    selectedCreatorOverrides,
}: CalculatorTabProps) {
    const {
        loading: itemNamesLoading,
        data: itemNameData,
        error: itemNameError,
    } = useQuery(GET_ITEM_NAMES_QUERY);
    const { data: itemDetailsData, error: itemDetailsError } = useQuery(
        GET_ITEM_DETAILS_QUERY,
        {
            variables: {
                filters: getItemDetailsFilters(
                    selectedItem,
                    selectedTool,
                    hasMachineTools,
                    selectedCreatorOverrides
                ),
            },
            skip: !selectedItem,
        }
    );

    const handleSelectedItemTotalChange = (total: Target) => {
        if ("amount" in total) {
            setTargetAmount(total.amount);
        } else {
            setWorkers(total.workers);
        }
    };

    const [workers, setWorkers] = useState<number | undefined>(
        target && "workers" in target ? target.workers : undefined
    );
    const [targetAmount, setTargetAmount] = useState<number | undefined>(
        target && "amount" in target ? target.amount : undefined
    );

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
                    <TargetInput
                        onTargetChange={setTarget}
                        defaultWorkers={workers}
                        defaultAmount={targetAmount}
                    />
                    <DefaultToolSelector
                        onToolChange={setSelectedTool}
                        defaultTool={selectedTool}
                    />
                    <MachineToolCheckbox
                        onChange={setHasMachineTools}
                        label="Machine tools available?"
                        checked={hasMachineTools}
                    />
                    <OutputUnitSelector
                        onUnitChange={setSelectedOutputUnit}
                        defaultUnit={selectedOutputUnit}
                    />
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
                    {target && selectedItem ? (
                        <Suspense fallback={<span>Loading...</span>}>
                            <Output
                                itemName={selectedItem}
                                target={target}
                                outputUnit={selectedOutputUnit}
                                maxAvailableTool={selectedTool}
                                hasMachineTools={hasMachineTools}
                                creatorOverrides={selectedCreatorOverrides}
                                onSelectedItemTotalChange={
                                    handleSelectedItemTotalChange
                                }
                            />
                        </Suspense>
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

type SettingsTabProps = {
    selectedCreatorOverrides: StateProp<CreatorOverride[]>;
};

function SettingsTab({
    selectedCreatorOverrides: [
        selectedCreatorOverrides,
        setSelectedCreatorOverrides,
    ],
}: SettingsTabProps) {
    return (
        <>
            <TabHeader>Overrides:</TabHeader>
            <CreatorOverrides
                defaultOverrides={selectedCreatorOverrides}
                onOverridesUpdate={setSelectedCreatorOverrides}
            />
        </>
    );
}

function AboutTab() {
    return (
        <>
            <span>
                Calculations are correct for version: 0.12.0.1 (2024-11-29)
            </span>
            <span>
                Calculations use public game data files from the{" "}
                <a href="https://github.com/pipliz/ColonySurvival">
                    Colony Survival repository
                </a>
                .
            </span>
        </>
    );
}

enum PageTabs {
    CALCULATOR = "calculator",
    SETTINGS = "settings",
    ABOUT = "about",
}

function Calculator() {
    const [selectedTab, setSelectedTab] = useState<PageTabs>(
        PageTabs.CALCULATOR
    );

    const selectedItemState = useState<string>();
    const targetState = useState<Target>();
    const selectedToolState = useState<AvailableTools>(AvailableTools.None);
    const hasMachineToolState = useState<boolean>(false);
    const selectedOutputUnitState = useState<OutputUnit>(OutputUnit.Minutes);
    const selectedCreatorOverrides = useState<CreatorOverride[]>([]);

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
                <button
                    role="tab"
                    aria-selected={selectedTab === PageTabs.ABOUT}
                    tabIndex={selectedTab === PageTabs.ABOUT ? 0 : -1}
                    onClick={() => setSelectedTab(PageTabs.ABOUT)}
                >
                    About
                </button>
            </Tabs>
            <TabContainer role="tabpanel">
                {selectedTab === PageTabs.CALCULATOR ? (
                    <CalculatorTab
                        itemState={selectedItemState}
                        currentTarget={targetState}
                        toolState={selectedToolState}
                        machineToolState={hasMachineToolState}
                        outputUnitState={selectedOutputUnitState}
                        selectedCreatorOverrides={selectedCreatorOverrides[0]}
                    />
                ) : null}
                {selectedTab === PageTabs.SETTINGS ? (
                    <SettingsTab
                        selectedCreatorOverrides={selectedCreatorOverrides}
                    />
                ) : null}
                {selectedTab === PageTabs.ABOUT ? <AboutTab /> : null}
            </TabContainer>
        </PageContainer>
    );
}

export default Calculator;
