export type AppSettings = {
    availableEditors: string[],
    customLocatedEditors: CustomExternalEditor[],
    externalEditor: string
}

export enum ExternalEditorType {
    Default = "default",
    Notepad = "notepad",
    NotepadPlusPlus = "notepad++",
    VSCode = "code",
    VSCodium = "codium"
}

export type CustomExternalEditor = {
    name: string,
    path: string
}