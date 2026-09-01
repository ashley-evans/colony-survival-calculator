import { AvailableDefaultTools } from "../../../../graphql/__generated__/graphql";
import { ToolSelectorI18NKeyMapping } from "../../utils";
import { Selector } from "../../../../common/components";
import { useTranslation } from "react-i18next";

type ToolSelectorProps = {
    onToolChange: (unit: AvailableDefaultTools) => void;
    defaultTool?: AvailableDefaultTools;
    className?: string;
};

const orderedTools: Record<AvailableDefaultTools, number> = {
    [AvailableDefaultTools.None]: 0,
    [AvailableDefaultTools.Stone]: 1,
    [AvailableDefaultTools.Copper]: 2,
    [AvailableDefaultTools.Iron]: 3,
    [AvailableDefaultTools.Bronze]: 4,
    [AvailableDefaultTools.Steel]: 5,
};

const tools = Object.keys(orderedTools) as AvailableDefaultTools[];

function ToolSelector({
    onToolChange,
    defaultTool,
    className,
}: ToolSelectorProps) {
    const { t } = useTranslation();

    const handleToolChange = (selectedTool?: AvailableDefaultTools) => {
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
