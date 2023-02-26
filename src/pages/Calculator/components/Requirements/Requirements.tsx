import React, { Fragment, ReactElement } from "react";

import { Items, Item } from "../../../../types";
import {
    RequirementsTable,
    TextColumnHeader,
    TextColumnCell,
    NumberColumnHeader,
    NumberColumnCell,
} from "./styles";

type RequirementRowProps = {
    name: string;
    workers: number;
};

function RequirementRow({ name, workers }: RequirementRowProps) {
    return (
        <tr key={name}>
            <TextColumnCell>{name}</TextColumnCell>
            <NumberColumnCell>{workers}</NumberColumnCell>
        </tr>
    );
}

type RequirementsProps = {
    items: Items;
    selectedItem: Item;
    workers: number;
};

function Requirements({ items, selectedItem, workers }: RequirementsProps) {
    const itemMap: Record<string, Item | undefined> = Object.fromEntries(
        items.map((item) => [item.name, item])
    );

    const calculateRequiredWorkers = (
        requirement: Item,
        amount: number
    ): number => {
        const createdInTime =
            (selectedItem.createTime / requirement.createTime) *
            requirement.output;
        return Math.ceil((amount / createdInTime) * workers);
    };

    const createRequirementRows = (currentItem: Item): ReactElement[] => {
        return currentItem.requires.map((requirement) => {
            const requiredItem = itemMap[requirement.name];
            if (!requiredItem) {
                throw new Error("Unknown required item");
            }

            return (
                <Fragment key={`${currentItem.name}-${requiredItem.name}`}>
                    <RequirementRow
                        name={requirement.name}
                        workers={calculateRequiredWorkers(
                            requiredItem,
                            requirement.amount
                        )}
                    />
                    {createRequirementRows(requiredItem)}
                </Fragment>
            );
        });
    };

    return (
        <>
            <h2>Requirements:</h2>
            <RequirementsTable>
                <thead>
                    <tr>
                        <TextColumnHeader>Item</TextColumnHeader>
                        <NumberColumnHeader>Workers</NumberColumnHeader>
                    </tr>
                </thead>
                <tbody>{createRequirementRows(selectedItem)}</tbody>
            </RequirementsTable>
        </>
    );
}

export { Requirements };
