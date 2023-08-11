import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

import { roundOutput } from "../../utils";
import {
    CreatorBreakdownRow,
    ExpandRowIconContainer,
    NumberColumnCell,
    TextColumnCell,
} from "./styles";

export type SingleCreatorRequirementsTableRow = {
    name: string;
    creator: string;
    amount: number;
    workers: number;
};

export type MultipleCreatorRequirementsTableRow = Omit<
    SingleCreatorRequirementsTableRow,
    "creator"
> & {
    isExpanded: boolean;
    creatorBreakdownRows: Omit<SingleCreatorRequirementsTableRow, "name">[];
};

export type RequirementsTableRow =
    | SingleCreatorRequirementsTableRow
    | MultipleCreatorRequirementsTableRow;

function isSingleCreatorRow(
    row: RequirementsTableRow
): row is SingleCreatorRequirementsTableRow {
    const casted = row as SingleCreatorRequirementsTableRow;
    return casted.creator !== undefined;
}

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
                    {row.isExpanded ? (
                        <ExpandRowIconContainer
                            role="button"
                            aria-label={"Collapse creator breakdown"}
                            tabIndex={0}
                            onClick={() => toggleCreatorBreakdown(row.name)}
                        >
                            <FontAwesomeIcon icon={faMinus} />
                        </ExpandRowIconContainer>
                    ) : (
                        <ExpandRowIconContainer
                            role="button"
                            aria-label={"Expand creator breakdown"}
                            tabIndex={0}
                            onClick={() => toggleCreatorBreakdown(row.name)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </ExpandRowIconContainer>
                    )}

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

export { RequirementRow, isSingleCreatorRow };
