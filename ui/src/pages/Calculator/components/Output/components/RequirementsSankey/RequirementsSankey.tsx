import { ResponsiveSankey, DefaultLink, DefaultNode } from "@nivo/sankey";

import { SankeyContainer } from "./styles";
import { Requirement } from "../../../../../../graphql/__generated__/graphql";
import { RequirementTreeNode, createTree } from "./utils";
import { roundOutput } from "../../../../utils";
import { useTheme } from "styled-components";

type RequirementsSankeyProps = {
    requirements: Requirement[];
    selectedItemID: string;
};

type ChartData = {
    nodes: DefaultNode[];
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

    const uniqueNodes = new Set<string>();
    const links: DefaultLink[] = [];
    const traverse = (node: RequirementTreeNode) => {
        uniqueNodes.add(node.name);

        node.children.map((child) => {
            links.push({
                source: node.name,
                target: child.name,
                value: child.amount,
            });
            traverse(child);
        });
    };

    traverse(tree);

    const nodes = Array.from(uniqueNodes.values()).map((name) => ({
        id: name,
    }));

    return { nodes, links };
};

function RequirementsSankey({
    requirements,
    selectedItemID,
}: RequirementsSankeyProps) {
    const theme = useTheme();
    const data = createSankeyChartData({ requirements, selectedItemID });

    if (data.links.length === 0) {
        return <></>;
    }

    return (
        <SankeyContainer height={data.nodes.length * 2}>
            <ResponsiveSankey
                data={data}
                colors={{ scheme: "pastel1" }}
                valueFormat={roundOutput}
                enableLinkGradient={true}
                margin={{ top: 16, bottom: 16, right: 16, left: 16 }}
                linkOpacity={theme.type === "dark" ? 0.25 : 1}
                linkBlendMode="normal"
            />
        </SankeyContainer>
    );
}

export { RequirementsSankey };
