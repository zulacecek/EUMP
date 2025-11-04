export type DropdownMenuViewModel = {
    options: DropdownMenuOption[],
    label: string
}

export type DropdownMenuOption = {
    id: string,
    label: string,
    onClick: Function
}