import { ResponsiveSankey, DefaultLink, DefaultNode } from "@nivo/sankey";
import { useTranslation } from "react-i18next";

import { SankeyContainer } from "./styles";
import { Requirement } from "../../../../../../graphql/__generated__/graphql";
import { RequirementTreeNode, createTree } from "./utils";
import { roundOutput } from "../../../../utils";
import { useTheme } from "styled-components";

type RequirementsSankeyProps = {
    requirements: Requirement[];
    selectedItemID: string;
};

type SankeyNode = DefaultNode & {
    label: string;
};

type ChartData = {
    nodes: SankeyNode[];
    links: DefaultLink[];
};

const createSankeyChartData = ({
    requirements,
    selectedItemID,
}: RequirementsSankeyProps): ChartData => {
    if (
        !requirements.find((requirement) => requirement.id === selectedItemID)
    ) {
        return { nodes: [], links: [] };
    }

    const tree = createTree(requirements, selectedItemID);
    const uniqueNodes = new Map<string, string>(); // id -> label (translated name)
    const links: DefaultLink[] = [];

    const traverse = (node: RequirementTreeNode) => {
        uniqueNodes.set(node.id, node.name);
        node.children.forEach((child) => {
            links.push({
                source: node.id,
                target: child.id,
                value: child.amount,
            });
            traverse(child);
        });
    };

    traverse(tree);

    const nodes = Array.from(uniqueNodes.entries()).map(([id, label]) => ({
        id,
        label,
    }));

    return { nodes, links };
};

function RequirementsSankey({
    requirements,
    selectedItemID,
}: RequirementsSankeyProps) {
    const theme = useTheme();
    const { i18n } = useTranslation();
    const data = createSankeyChartData({ requirements, selectedItemID });

    if (data.links.length === 0) {
        return <></>;
    }

    return (
        <SankeyContainer height={data.nodes.length * 2}>
            <ResponsiveSankey<SankeyNode, DefaultLink>
                data={data}
                colors={{ scheme: "pastel1" }}
                valueFormat={(value) => roundOutput(i18n.language, value)}
                enableLinkGradient={true}
                margin={{ top: 16, bottom: 16, right: 16, left: 16 }}
                linkOpacity={theme.type === "dark" ? 0.25 : 1}
                linkBlendMode="normal"
                label="label"
            />
        </SankeyContainer>
    );
}

export { RequirementsSankey };
