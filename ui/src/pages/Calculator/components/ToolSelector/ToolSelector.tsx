import { AvailableTools } from "../../../../graphql/__generated__/graphql";
import { ToolSelectorI18NKeyMapping } from "../../utils";
import { Selector } from "../../../../common/components";
import { useTranslation } from "react-i18next";

type ToolSelectorProps = {
    onToolChange: (unit: AvailableTools) => void;
    defaultTool?: AvailableTools;
    className?: string;
};

const orderedTools: Record<AvailableTools, number> = {
    [AvailableTools.None]: 0,
    [AvailableTools.Stone]: 1,
    [AvailableTools.Copper]: 2,
    [AvailableTools.Iron]: 3,
    [AvailableTools.Bronze]: 4,
    [AvailableTools.Steel]: 5,
};

const tools = Object.keys(orderedTools) as AvailableTools[];

function ToolSelector({
    onToolChange,
    defaultTool,
    className,
}: ToolSelectorProps) {
    const { t } = useTranslation();

    const handleToolChange = (selectedTool?: AvailableTools) => {
        if (selectedTool) onToolChange(selectedTool);
    };

    return (
        <Selector
            items={tools}
            itemToKey={(tool) => tool}
            itemToDisplayText={(tool) =>
                t(
                    `calculator.tools.mapping.${ToolSelectorI18NKeyMapping[tool]}`,
                )
            }
            labelText={t("calculator.tools.label")}
            defaultSelectedItem={defaultTool ?? tools[0]}
            onSelectedItemChange={handleToolChange}
            palette="secondary"
            className={className}
        />
    );
}

export { ToolSelector };
