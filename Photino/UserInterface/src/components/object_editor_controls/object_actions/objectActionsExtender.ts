export const openNewObjectModalEventName = 'OpenNewObjectModalEvent';
export const openImportObjectModalEventName = 'OpenImportObjectModalEvent';

export type ActionButtonOptions = {
    status: ActionButtonStatus,
    enabled: Boolean
}

export enum ActionButtonStatus { 
    Unknown = "unknown",
    Ok = "ok",
    Warning = "warning",
    Error = "error",
}