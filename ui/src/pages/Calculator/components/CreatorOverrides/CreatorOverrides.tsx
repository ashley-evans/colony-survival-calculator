import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

import { gql } from "../../../../graphql/__generated__";
import { Icon, LargeAddButton, OverrideListContainer } from "./styles";
import {
    CreatorOverride,
    Item,
} from "../../../../graphql/__generated__/graphql";
import { CreatorOverrideSelector } from "./CreatorOverrideSelector";

const UNHANDLED_EXCEPTION =
    "Something went wrong, please refresh and try again.";

const GET_ITEMS_WITH_MULTIPLE_CREATORS = gql(`
    query GetMultipleCreatorDetails($locale: String) {
        item(filters: { minimumCreators: 2 }, locale: $locale) {
            id
            name
            creatorID
            creator
        }
    }
`);

type NamedEntity = { id: string; name: string };
type CreatorMap = Map<string, NamedEntity[]>;
type ItemMap = Map<string, NamedEntity>;

function groupItems(
    items: Pick<Item, "id" | "name" | "creatorID" | "creator">[],
): { itemMap: ItemMap; creatorMap: CreatorMap } {
    const itemMap = new Map<string, NamedEntity>();
    const creatorMap = new Map<string, NamedEntity[]>();

    for (const { id, name, creatorID, creator } of items) {
        if (!itemMap.has(id)) {
            itemMap.set(id, { id, name });
        }

        if (!creatorMap.has(id)) {
            creatorMap.set(id, []);
        }

        const creators = creatorMap.get(id)!;
        if (!creators.some((c) => c.id === creatorID)) {
            creators.push({ id: creatorID, name: creator });
        }
    }

    return { itemMap, creatorMap };
}

type CreatorOverridesProps = {
    defaultOverrides: CreatorOverride[];
    onOverridesUpdate: (overrides: CreatorOverride[]) => void;
};

function CreatorOverrides({
    defaultOverrides,
    onOverridesUpdate,
}: CreatorOverridesProps) {
    const { t, i18n } = useTranslation();
    const { loading, data } = useQuery(GET_ITEMS_WITH_MULTIPLE_CREATORS, {
        variables: { locale: i18n.language },
    });

    const [creatorMap, setCreatorMap] = useState<CreatorMap>(new Map());
    const [itemMap, setItemMap] = useState<ItemMap>(new Map());
    const [allItems, setAllItems] = useState<NamedEntity[]>([]);
    const [activeOverrides, setActiveOverrides] = useState<Map<string, string>>(
        new Map(),
    );

    useEffect(() => {
        if (data?.item) {
            const { itemMap, creatorMap } = groupItems(data.item);
            setItemMap(itemMap);
            setAllItems(Array.from(itemMap.values()));
            setCreatorMap(creatorMap);
        }

        if (defaultOverrides) {
            const active = new Map(
                defaultOverrides.map(({ itemID, creatorID }) => [
                    itemID,
                    creatorID,
                ]),
            );

            setActiveOverrides(active);
        }
    }, [data]);

    useEffect(() => {
        const overrides: CreatorOverride[] = Array.from(
            activeOverrides.entries(),
        ).map(([itemID, creatorID]) => ({ itemID, creatorID }));
        onOverridesUpdate(overrides);
    }, [activeOverrides]);

    const canOverrideBeAdded = () => activeOverrides.size !== allItems.length;

    const getItem = (itemID: string): NamedEntity => {
        const item = itemMap.get(itemID);
        if (!item) {
            throw new Error(UNHANDLED_EXCEPTION);
        }

        return item;
    };

    const getItemCreators = (itemID: string): NamedEntity[] => {
        const creators = creatorMap.get(itemID);
        if (!creators) {
            throw new Error(UNHANDLED_EXCEPTION);
        }

        return creators;
    };

    const getCreator = (itemID: string, creatorID: string): NamedEntity => {
        const creators = getItemCreators(itemID);
        const creator = creators.find((c) => c.id === creatorID);
        if (!creator) {
            throw new Error(UNHANDLED_EXCEPTION);
        }

        return creator;
    };

    const getNextOverride = (): [NamedEntity, NamedEntity[]] => {
        const availableItems = allItems.filter(
            (item) => !activeOverrides.has(item.id),
        );

        const nextItem = availableItems[0];
        return [nextItem, getItemCreators(nextItem.id)];
    };

    const setOverride = (itemID: string, creatorID: string) => {
        const active = new Map(activeOverrides);
        active.set(itemID, creatorID);
        setActiveOverrides(active);
    };

    const removeOverride = (itemID: string) => {
        const active = new Map(activeOverrides);
        active.delete(itemID);
        setActiveOverrides(active);
    };

    const handleOverrideItemChange = (newItemID: string, oldItemID: string) => {
        const newItemCreators = getItemCreators(newItemID);
        const active = new Map(activeOverrides);
        active.set(newItemID, newItemCreators[0].id);
        active.delete(oldItemID);
        setActiveOverrides(active);
    };

    return (
        <>
            <span>{t("settings.description")}</span>
            {loading ? <span>{t("settings.loading")}</span> : null}
            {!loading && data?.item.length === 0 ? (
                <span role="alert">{t("settings.none")}</span>
            ) : null}
            {data && data.item.length > 0 ? (
                <OverrideListContainer>
                    {Array.from(activeOverrides.entries()).map(
                        ([itemID, creatorID]) => (
                            <CreatorOverrideSelector
                                key={itemID}
                                items={allItems.filter(
                                    (item) =>
                                        !activeOverrides.has(item.id) ||
                                        item.id === itemID,
                                )}
                                creators={getItemCreators(itemID)}
                                defaultItem={getItem(itemID)}
                                defaultCreator={getCreator(itemID, creatorID)}
                                onSelectedItemChange={handleOverrideItemChange}
                                onSelectedCreatorChange={setOverride}
                                onRemove={removeOverride}
                            />
                        ),
                    )}
                    {canOverrideBeAdded() ? (
                        <LargeAddButton
                            onClick={() => {
                                const [item, creators] = getNextOverride();
                                setOverride(item.id, creators[0].id);
                            }}
                        >
                            <span>{t("settings.selector.add")}</span>
                            <Icon icon={faAdd} />
                        </LargeAddButton>
                    ) : null}
                </OverrideListContainer>
            ) : null}
        </>
    );
}

export { CreatorOverrides };
