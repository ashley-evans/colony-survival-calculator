import React from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { CreatorBreakdownTableRow } from "./types";
import { RequirementsRowProps } from "./RequirementRow";
import {
    CreatorBreakdownRow as StyledRow,
    BreakdownRow,
    TextColumnCell,
    NumberColumnCell,
    ExpandRowIconContainer,
    ExpandRowIcon,
} from "./styles";
import { roundOutput } from "../../../../utils";

type CreatorBreakdownRowProps = {
    row: CreatorBreakdownTableRow;
} & Pick<RequirementsRowProps, "toggleBreakdown">;

function CreatorBreakdownRow({
    row,
    toggleBreakdown,
}: CreatorBreakdownRowProps) {
    return (
        <>
            <StyledRow>
                <TextColumnCell />
                <TextColumnCell>
                    {row.demands.length > 0 ? (
                        <ExpandRowIconContainer
                            role="button"
                            aria-label={
                                row.isExpanded
                                    ? "Collapse demand breakdown"
                                    : "Expand demand breakdown"
                            }
                            tabIndex={0}
                            onClick={() => toggleBreakdown(row.key)}
                        >
                            <ExpandRowIcon
                                icon={faChevronDown}
                                $expanded={row.isExpanded}
                            />
                        </ExpandRowIconContainer>
                    ) : null}
                    {row.creator}
                </TextColumnCell>
                <TextColumnCell />
                <NumberColumnCell>{roundOutput(row.amount)}</NumberColumnCell>
                <NumberColumnCell>{Math.ceil(row.workers)}</NumberColumnCell>
            </StyledRow>
            {row.isExpanded
                ? row.demands.map(({ key, name, amount }) => (
                      <BreakdownRow
                          key={key}
                          row={{ demandName: name, amount }}
                      />
                  ))
                : null}
        </>
    );
}

export { CreatorBreakdownRow };
