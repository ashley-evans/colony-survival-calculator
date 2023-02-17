import React from "react";

import { Items, Item, Requirement } from "../types";

type RequirementsProps = {
    items: Items;
    selectedItem: Item;
    workers: number;
    onError: (error: string) => void;
};

function Requirements({
    items,
    selectedItem,
    workers,
    onError,
}: RequirementsProps) {
    const itemMap: Record<string, Item | undefined> = Object.fromEntries(
        items.map((item) => [item.name, item])
    );

    const calculateRequiredWorkers = (
        requirement: Requirement
    ): number | undefined => {
        const requiredItem = itemMap[requirement.name];
        if (!requiredItem) {
            onError("Unknown required item");
            return;
        }

        const createdInTime =
            (selectedItem.createTime / requiredItem.createTime) *
            requiredItem.output;
        return (requirement.amount / createdInTime) * workers;
    };

    return (
        <>
            <h2>Requirements:</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Workers</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{selectedItem.requires[0].name}</td>
                        <td>
                            {calculateRequiredWorkers(selectedItem.requires[0])}
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}

export { Requirements };
