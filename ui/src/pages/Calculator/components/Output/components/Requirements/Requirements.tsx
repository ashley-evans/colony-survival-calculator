import React, { MouseEventHandler, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faSort,
    faSortAsc,
    faSortDesc,
} from "@fortawesome/free-solid-svg-icons";

import {
    RequirementsTable,
    TextColumnHeader,
    Header,
    SortableHeader,
    TableContainer,
    TotalRow,
} from "./styles";
import { RequirementRow } from "./RequirementRow";
import {
    ValidSortDirections,
    sortBy,
    sortDirectionOrderMap,
    mapRequirementsToRows,
    toggleBreakdown,
} from "./utils";
import { RequirementsTableRow } from "./types";
import { Requirement } from "../../../../../../graphql/__generated__/graphql";

type RequirementsProps = {
    requirements: Requirement[];
};

const sortDirectionIconMap: { [key in ValidSortDirections]: IconDefinition } = {
    none: faSort,
    descending: faSortDesc,
    ascending: faSortAsc,
};

function Requirements({ requirements }: RequirementsProps) {
    const [amountSortDirection, setAmountSortDirection] =
        useState<ValidSortDirections>("none");
    const [workerSortDirection, setWorkerSortDirection] =
        useState<ValidSortDirections>("none");
    const [rows, setRows] = useState<RequirementsTableRow[]>([]);

    const changeAmountSortDirection: MouseEventHandler = (event) => {
        event.stopPropagation();
        setWorkerSortDirection("none");
        setAmountSortDirection(sortDirectionOrderMap[amountSortDirection]);
    };

    const changeWorkerSortDirection: MouseEventHandler = (event) => {
        event.stopPropagation();
        setAmountSortDirection("none");
        setWorkerSortDirection(sortDirectionOrderMap[workerSortDirection]);
    };

    const toggleRowExpansion = (key: string) => {
        const updated = toggleBreakdown(key, rows);
        setRows([...updated]);
    };

    useEffect(() => {
        const updated = mapRequirementsToRows(requirements);
        setRows(updated);
    }, [requirements]);

    if (rows.length === 0) {
        return <></>;
    }

    const sortedRows =
        workerSortDirection !== "none"
            ? sortBy(rows, workerSortDirection, "workers")
            : sortBy(rows, amountSortDirection, "amount");

    const totalWorkers = rows.reduce((acc, { workers }) => {
        return acc + Math.ceil(workers);
    }, 0);

    return (
        <>
            <Header>Requirements:</Header>
            <TableContainer>
                <RequirementsTable>
                    <thead>
                        <tr>
                            <TextColumnHeader>Item</TextColumnHeader>
                            <TextColumnHeader>Creator</TextColumnHeader>
                            <TextColumnHeader>Demand</TextColumnHeader>
                            <SortableHeader
                                item-alignment="end"
                                aria-sort={amountSortDirection}
                                onClick={changeAmountSortDirection}
                                tabIndex={0}
                            >
                                <button>Amount</button>
                                <FontAwesomeIcon
                                    icon={
                                        sortDirectionIconMap[
                                            amountSortDirection
                                        ]
                                    }
                                    aria-hidden="true"
                                />
                            </SortableHeader>
                            <SortableHeader
                                item-alignment="end"
                                aria-sort={workerSortDirection}
                                onClick={changeWorkerSortDirection}
                                tabIndex={0}
                            >
                                <button>Workers</button>
                                <FontAwesomeIcon
                                    icon={
                                        sortDirectionIconMap[
                                            workerSortDirection
                                        ]
                                    }
                                    aria-hidden="true"
                                />
                            </SortableHeader>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((requirement) => (
                            <RequirementRow
                                key={requirement.key}
                                row={requirement}
                                toggleBreakdown={toggleRowExpansion}
                            />
                        ))}
                    </tbody>
                    {rows.length > 1 && totalWorkers ? (
                        <tfoot>
                            <TotalRow
                                row={{ name: "Total:", workers: totalWorkers }}
                            />
                        </tfoot>
                    ) : null}
                </RequirementsTable>
            </TableContainer>
        </>
    );
}

export { Requirements };
