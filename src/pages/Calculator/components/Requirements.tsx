import React from "react";

import { Items, Item, Requirement } from "../types";

type RequirementsProps = {
    items: Items;
    selectedItem: Item;
    workers: number;
};

function Requirements({ items, selectedItem, workers }: RequirementsProps) {
    const itemMap: Record<string, Item | undefined> = Object.fromEntries(
        items.map((item) => [item.name, item])
    );

    const calculateRequiredWorkers = (requirement: Requirement): number => {
        const requiredItem = itemMap[requirement.name];
        if (!requiredItem) {
            throw new Error("Unknown required item");
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
                    {selectedItem.requires.map((requirement) => (
                        <tr key={requirement.name}>
                            <td>{requirement.name}</td>
                            <td>{calculateRequiredWorkers(requirement)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

export { Requirements };
