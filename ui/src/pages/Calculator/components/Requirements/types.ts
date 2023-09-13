import { Requirements as WrappedRequirements } from "../../../../graphql/__generated__/graphql";

export type Requirements = WrappedRequirements["requirements"];

export enum RowType {
    SingleCreator = "SingleCreator",
    MultipleCreator = "MultipleCreator",
    CreatorBreakdown = "CreatorBreakdown",
    Demand = "Demand",
}

export type SortableFields = {
    amount: number;
    workers: number;
};

export type NonSortableFields = {
    key: string;
    name: string;
    creator: string;
    demandName: string;
};

export type TableFields = SortableFields & NonSortableFields;

export type DemandTableRow = Pick<TableFields, "name" | "amount" | "key"> & {
    type: RowType.Demand;
};

export type SingleCreatorRequirementsTableRow = Omit<
    TableFields,
    "demandName"
> & {
    isExpanded: boolean;
    demands: DemandTableRow[];
    type: RowType.SingleCreator;
};

export type CreatorBreakdownTableRow = Omit<
    SingleCreatorRequirementsTableRow,
    "name" | "type"
> & { type: RowType.CreatorBreakdown };

export type MultipleCreatorRequirementsTableRow = Omit<
    SingleCreatorRequirementsTableRow,
    "creator" | "type" | "demands"
> & {
    creatorBreakdownRows: CreatorBreakdownTableRow[];
    type: RowType.MultipleCreator;
};

export type RequirementsTableRow =
    | SingleCreatorRequirementsTableRow
    | MultipleCreatorRequirementsTableRow;
