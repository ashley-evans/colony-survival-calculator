interface JSONFileReader<T> {
    (path: string): Promise<T>;
}

export type { JSONFileReader };
