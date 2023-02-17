import React from "react";

import { Items, Item } from "../types";

type RequirementsProps = {
    items: Items;
    selectedItem: Item;
    workers: number;
};

function Requirements({ items, selectedItem, workers }: RequirementsProps) {
    const itemMap = Object.fromEntries(items.map((item) => [item.name, item]));

    const calculateRequiredWorkers = (
        requiredItemName: string
    ): number | undefined => {
        const requirement = selectedItem.requires.find(
            (i) => i.name == requiredItemName
        );
        if (!requirement) {
            return;
        }

        const requiredItem = itemMap[requiredItemName];
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
                            {calculateRequiredWorkers(
                                selectedItem.requires[0].name
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>
        </>
    );
}

export { Requirements };
