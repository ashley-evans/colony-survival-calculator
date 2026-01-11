import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import {
    ExpandRowIcon,
    ExpandRowIconContainer,
    NumberColumnCell,
    TextColumnCell,
} from "./styles";
import { roundOutput } from "../../../../utils";
import { TableFields } from "./types";

type RowProps = {
    className?: string;
} & (
    | {
          row: Partial<TableFields>;
      }
    | {
          row: Partial<TableFields>;
          isExpanded: boolean;
          expandLabel: string;
          collapseLabel: string;
          toggleExpansion: () => void;
      }
);

function Row({ className, row, ...rest }: RowProps) {
    const { i18n } = useTranslation();

    return (
        <tr className={className}>
            <TextColumnCell>
                {"isExpanded" in rest ? (
                    <ExpandRowIconContainer
                        role="button"
                        aria-label={
                            rest.isExpanded
                                ? rest.collapseLabel
                                : rest.expandLabel
                        }
                        tabIndex={0}
                        onClick={rest.toggleExpansion}
                    >
                        <ExpandRowIcon
                            icon={faChevronDown}
                            $expanded={rest.isExpanded}
                        />
                    </ExpandRowIconContainer>
                ) : null}

                {row.name}
            </TextColumnCell>
            <TextColumnCell>{row.creator}</TextColumnCell>
            <TextColumnCell>{row.demandName}</TextColumnCell>
            <NumberColumnCell>
                {row.amount ? roundOutput(i18n.language, row.amount) : ""}
            </NumberColumnCell>
            <NumberColumnCell>
                {row.workers
                    ? Math.ceil(row.workers).toLocaleString(i18n.language)
                    : ""}
            </NumberColumnCell>
        </tr>
    );
}

export { Row };
