import { ElementType } from "@prisma/client";

export function damageTypeMapper(type: string) {
    const listType = ElementType;
    if (Object.values(listType).includes(type as ElementType)) {
        return type;
    }
    console.warn('UNKNOWN TYPE : ' + type);
    return ElementType.LUMIERE;
}