import { IProperty } from "./iproperty";

export interface Favorite {
    id: number;
    propertyId: number;
    userId: number;
      property: IProperty;

    // title?: string;
    // imageUrl?: string;
}
