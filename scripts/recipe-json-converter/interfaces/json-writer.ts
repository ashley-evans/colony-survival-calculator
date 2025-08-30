interface JSONWriter {
    (path: string, content: unknown): Promise<boolean>;
}

export type { JSONWriter };
