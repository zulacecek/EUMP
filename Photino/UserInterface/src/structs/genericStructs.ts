export type KeyValuePair<K, V> = {
    key: K;
    value: V;
}

export type ObjectGroup = GroupedObject & {
    id: string,
    group_name: string,
    group_file_name: string
}

export type GroupedObject = {
    group_id: string,
    change_category: ObjectType,
    is_imported: boolean
}

export type GameObject = {
    id: string,
    name: string,
    isImported: boolean,
    generateReplacementFile: boolean,
    lastModifed: number,
    originalFileName: string,
}

export type AvailableObject = {
    id: string,
    name: string,
    type: ObjectType
}

export enum ObjectType {
    Unknown = "Unknown",
    MissionTree = "MissionTree",
    Localisation = "Localisation",
    CountryTags = "CountryTags",
    ProvinceDefinition = "ProvinceDefinition",
    Area = "Area",
    Climate = "Climate",
    MapInfo = "MapInfo",
    TradeGoods = "TradeGoods",
    ColonialRegions = "ColonialRegions",
    TradeNodes = "TradeNodes",
    SuperRegions = "SuperRegions",
    Regions = "Regions",
    Country = "Country",
    ReligiousGroups = "ReligiousGroups",
    ProvinceHistory = "ProvinceHistory",
    ObjectGroup = "ObjectGroup",
    ModSettings = "ModSettings",
    AppSettings = "AppSettings",
    GFXFile = "GFXFile",
    TextFile = "TextFile"
}

export type ChangedObjects = {
    changedObjects: Map<string, ChangedObject>
}

export type ChangedObject = {
    objectCategory: ObjectType;
    objectId: string,
    objectName: string,
    changeType: ChangedObjectActionType,
    ignoreChangeCheck: boolean
}

export enum ChangedObjectActionType {
    None = "none",
    Update = "update",
    Delete = "delete",
    New = "new"
}