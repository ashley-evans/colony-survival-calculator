import { useTranslation } from "react-i18next";

import { OutputUnit } from "../../../../graphql/__generated__/graphql";
import { OutputUnitI18NKeyMapping } from "../../utils";
import { Selector } from "../../../../common/components";

type ItemSelectorProps = {
    onUnitChange: (unit: OutputUnit) => void;
    defaultUnit?: OutputUnit;
};

const outputUnits = Object.values(OutputUnit);

function OutputUnitSelector({ onUnitChange, defaultUnit }: ItemSelectorProps) {
    const { t } = useTranslation();

    const handleUnitChange = (selectedUnit?: OutputUnit) => {
        if (selectedUnit) onUnitChange(selectedUnit);
    };

    return (
        <Selector
            items={outputUnits}
            itemToKey={(unit) => unit}
            itemToDisplayText={(unit) =>
                t(`calculator.output.units.${OutputUnitI18NKeyMapping[unit]}`)
            }
            labelText={t("calculator.output.label")}
            defaultSelectedItem={defaultUnit ?? outputUnits[1]}
            onSelectedItemChange={handleUnitChange}
            palette="secondary"
        />
    );
}

export { OutputUnitSelector };
