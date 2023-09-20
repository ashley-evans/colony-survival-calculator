import React from "react";
import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock(
    "../pages/Calculator/components/Output/components/RequirementsSankey",
    () => ({
        default: () => {
            return <></>;
        },
    })
);
