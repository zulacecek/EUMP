import type { ObjectType } from "typescript"
import type { GameObject } from "./genericStructs"

export type SpriteType = {
    name: string,
    textureFile: string,
}

export type GfxFile = GameObject & {
    name: string,
    sprites: SpriteType[],
    objectType: ObjectType
}