import { Entity, Register } from "./types"

export const isOrigin = (register: Register<Entity>): boolean => {
    if (isByRowSource(register))
        return register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId
    else if (isByGroupSource(register))
        return register.sourceAbsoluteId == register.sourceRelativeId
    else
        throw Error("Unknown register origin type")
}

export function isByRowSource(register: Register<Entity>): boolean {
    return register.sourceRelativeId != null && !register.sourceRelativeId.startsWith("00000000")
}

export function isByGroupSource(register: Register<Entity>): boolean {
    return register.sourceRelativeId != null && register.sourceRelativeId.startsWith("00000000")
}