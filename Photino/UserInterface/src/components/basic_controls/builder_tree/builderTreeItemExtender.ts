import type { ValueType } from "@/structs/uiStructs";

export type TreeItemEntry = {
    type: TreeItemType;
    key: string;
    keyType: ValueType;
    position: number;
    allowChanges: boolean;
    isOptional: boolean;
    isOpened: boolean;
    statement: Statement;
    childEntries: TreeItemEntry[];
    category: string;
    treeType: string;
}

export enum TreeItemType {
    Empty = "empty",
    New = "new",
    TopLevel = "toplevel",
    Statement = "statement",
    Clause = "clause"
}

export type Statement = {
    statementType: ValueType;
    statementCategory: string;
    statementValueCategory: string;
    key: string;
    value: string;
}