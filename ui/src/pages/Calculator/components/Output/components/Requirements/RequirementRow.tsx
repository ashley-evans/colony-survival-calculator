import { BreakdownRow } from "./styles";
import {
    MultipleCreatorRequirementsTableRow,
    RequirementsTableRow,
    RowType,
    SingleCreatorRequirementsTableRow,
} from "./types";
import { Row } from "./Row";
import { CreatorBreakdownRow } from "./CreatorBreakdownRow";

type CreatorRowProps = {
    row: SingleCreatorRequirementsTableRow;
} & Pick<RequirementsRowProps, "toggleBreakdown">;

function CreatorRow({ row, toggleBreakdown }: CreatorRowProps) {
    const expansionProperties =
        row.demands.length > 0
            ? {
                  isExpanded: row.isExpanded,
                  expandLabel: "Expand demand breakdown",
                  collapseLabel: "Collapse demand breakdown",
                  toggleExpansion: () => toggleBreakdown(row.key),
              }
            : {};

    return (
        <>
            <Row row={row} {...expansionProperties} />
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

type MultipleCreatorProps = Pick<RequirementsRowProps, "toggleBreakdown"> & {
    row: MultipleCreatorRequirementsTableRow;
};

function MultipleCreatorRow({ row, toggleBreakdown }: MultipleCreatorProps) {
    return (
        <>
            <Row
                row={row}
                isExpanded={row.isExpanded}
                expandLabel="Expand creator breakdown"
                collapseLabel="Collapse creator breakdown"
                toggleExpansion={() => toggleBreakdown(row.key)}
            />
            {row.isExpanded
                ? row.creatorBreakdownRows.map((breakdown) => (
                      <CreatorBreakdownRow
                          key={breakdown.key}
                          row={breakdown}
                          toggleBreakdown={toggleBreakdown}
                      />
                  ))
                : null}
        </>
    );
}

export type RequirementsRowProps = {
    row: RequirementsTableRow;
    toggleBreakdown: (key: string) => void;
};

function RequirementRow({ row, toggleBreakdown }: RequirementsRowProps) {
    switch (row.type) {
        case RowType.SingleCreator:
            return <CreatorRow row={row} toggleBreakdown={toggleBreakdown} />;
        default:
            return (
                <MultipleCreatorRow
                    row={row}
                    toggleBreakdown={toggleBreakdown}
                />
            );
    }
}

export { RequirementRow };
