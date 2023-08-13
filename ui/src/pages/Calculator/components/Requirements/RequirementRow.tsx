import React from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

import { roundOutput } from "../../utils";
import {
    CreatorBreakdownRow,
    ExpandRowIcon,
    ExpandRowIconContainer,
    NumberColumnCell,
    TextColumnCell,
} from "./styles";
import {
    MultipleCreatorRequirementsTableRow,
    RequirementsTableRow,
    SingleCreatorRequirementsTableRow,
    isSingleCreatorRow,
} from "./types";

type RequirementsRowProps = {
    row: RequirementsTableRow;
    toggleCreatorBreakdown: (itemName: string) => void;
};

function SingleCreatorRow({ row }: { row: SingleCreatorRequirementsTableRow }) {
    return (
        <tr>
            <TextColumnCell>{row.name}</TextColumnCell>
            <TextColumnCell>{row.creator}</TextColumnCell>
            <NumberColumnCell>{roundOutput(row.amount)}</NumberColumnCell>
            <NumberColumnCell>{Math.ceil(row.workers)}</NumberColumnCell>
        </tr>
    );
}

type MultipleCreatorProps = Pick<
    RequirementsRowProps,
    "toggleCreatorBreakdown"
> & {
    row: MultipleCreatorRequirementsTableRow;
};

function MultipleCreatorRow({
    row,
    toggleCreatorBreakdown,
}: MultipleCreatorProps) {
    return (
        <>
            <tr>
                <TextColumnCell>
                    <ExpandRowIconContainer
                        role="button"
                        aria-label={
                            row.isExpanded
                                ? "Collapse creator breakdown"
                                : "Expand creator breakdown"
                        }
                        tabIndex={0}
                        onClick={() => toggleCreatorBreakdown(row.name)}
                    >
                        <ExpandRowIcon
                            icon={faChevronDown}
                            expanded={row.isExpanded}
                        />
                    </ExpandRowIconContainer>

                    {row.name}
                </TextColumnCell>
                <TextColumnCell>
                    {isSingleCreatorRow(row) ? row.creator : ""}
                </TextColumnCell>
                <NumberColumnCell>{roundOutput(row.amount)}</NumberColumnCell>
                <NumberColumnCell>{Math.ceil(row.workers)}</NumberColumnCell>
            </tr>
            {row.isExpanded
                ? row.creatorBreakdownRows.map((breakdown) => (
                      <CreatorBreakdownRow
                          key={`${row.name}-${breakdown.creator}`}
                      >
                          <TextColumnCell></TextColumnCell>
                          <TextColumnCell>{breakdown.creator}</TextColumnCell>
                          <NumberColumnCell>
                              {roundOutput(breakdown.amount)}
                          </NumberColumnCell>
                          <NumberColumnCell>
                              {Math.ceil(breakdown.workers)}
                          </NumberColumnCell>
                      </CreatorBreakdownRow>
                  ))
                : null}
        </>
    );
}

function RequirementRow({ row, toggleCreatorBreakdown }: RequirementsRowProps) {
    return isSingleCreatorRow(row) ? (
        <SingleCreatorRow row={row} />
    ) : (
        <MultipleCreatorRow
            row={row}
            toggleCreatorBreakdown={toggleCreatorBreakdown}
        />
    );
}

export { RequirementRow };
