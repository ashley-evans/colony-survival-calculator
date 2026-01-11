import { useState, Suspense, lazy } from "react";
import { useQuery } from "@apollo/client/react";
import { Trans, useTranslation } from "react-i18next";

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
    query GetItemNames($locale: String) {
        distinctItemNames(locale: $locale) {
            id
            name
        }
    }
`);

const GET_ITEM_DETAILS_QUERY = gql(`
    query GetItemDetails($filters: ItemsFilters!, $locale: String) {
        item(filters: $filters, locale: $locale) {
            id
            creatorID
            size {
                width
                height
            }
        }
    }
`);

type StateProp<S> = [S, (value: S) => void];

type CalculatorTabProps = {
    itemIDState: StateProp<string | undefined>;
    currentTarget: StateProp<Target | undefined>;
    toolState: StateProp<AvailableTools>;
    machineToolState: StateProp<boolean>;
    outputUnitState: StateProp<OutputUnit>;
    selectedCreatorOverrides: CreatorOverride[];
};

function getItemDetailsFilters(
    itemID?: string,
    tool?: AvailableTools,
    hasMachineTools?: boolean,
    overrides?: CreatorOverride[],
): ItemsFilters {
    const creatorID = overrides
        ? overrides.find(({ itemID: currentID }) => itemID === currentID)
              ?.creatorID
        : undefined;

    return creatorID
        ? { id: itemID, creatorID }
        : {
              id: itemID,
              optimal: { maxAvailableTool: tool, hasMachineTools },
          };
}

function CalculatorTab({
    itemIDState: [selectedItemID, setSelectedItemID],
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
                    selectedItemID,
                    selectedTool,
                    hasMachineTools,
                    selectedCreatorOverrides,
                ),
            },
            skip: !selectedItemID,
        },
    );
    const { t } = useTranslation();

    const handleSelectedItemTotalChange = (total: Target) => {
        if ("amount" in total) {
            setTargetAmount(total.amount);
        } else {
            setWorkers(total.workers);
        }
    };

    const [workers, setWorkers] = useState<number | undefined>(
        target && "workers" in target ? target.workers : undefined,
    );
    const [targetAmount, setTargetAmount] = useState<number | undefined>(
        target && "amount" in target ? target.amount : undefined,
    );

    if (itemNamesLoading) {
        return (
            <PageContainer>
                <span>{t("calculator.items.loading")}</span>
            </PageContainer>
        );
    }

    const networkError = itemNameError || itemDetailsError;

    return (
        <>
            <TabHeader>{t("calculator.header")}</TabHeader>
            {itemNameData?.distinctItemNames &&
            itemNameData.distinctItemNames.length > 0 ? (
                <>
                    <ItemSelector
                        items={itemNameData.distinctItemNames}
                        onItemChange={setSelectedItemID}
                        defaultSelectedItemID={selectedItemID}
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
                        label={t("calculator.tools.machineTools.label")}
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
                            {t("calculator.items.optimalFarmSize", {
                                width: itemDetailsData?.item[0].size.width,
                                height: itemDetailsData?.item[0].size.height,
                            })}
                        </span>
                    ) : null}
                    {target && selectedItemID ? (
                        <Suspense fallback={<span>{t("loading")}</span>}>
                            <Output
                                itemID={selectedItemID}
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
                <span role="alert">{t("calculator.items.errors.known")}</span>
            ) : null}
            {networkError ? (
                <span role="alert">{t("calculator.items.errors.network")}</span>
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
    const { t } = useTranslation();

    return (
        <>
            <TabHeader>{t("settings.header")}</TabHeader>
            <CreatorOverrides
                defaultOverrides={selectedCreatorOverrides}
                onOverridesUpdate={setSelectedCreatorOverrides}
            />
        </>
    );
}

function AboutTab() {
    const { t } = useTranslation();

    return (
        <>
            <span>
                {t("about.version", {
                    version: "0.12.0.1",
                    date: "2024-11-29",
                })}
            </span>
            <span>
                <Trans
                    i18nKey="about.source"
                    components={{
                        repoLink: (
                            <a href="https://github.com/pipliz/ColonySurvival" />
                        ),
                    }}
                />
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
        PageTabs.CALCULATOR,
    );

    const selectedItemIDState = useState<string>();
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
                        itemIDState={selectedItemIDState}
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
