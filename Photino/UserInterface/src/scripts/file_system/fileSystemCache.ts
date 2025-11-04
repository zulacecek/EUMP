export type FileSystemCachedObject = {
    name: string,
    type: FileSystemCachedObjectType
}

export enum FileSystemCachedObjectType {
    None = 0,
    MissionIcon = 1
}