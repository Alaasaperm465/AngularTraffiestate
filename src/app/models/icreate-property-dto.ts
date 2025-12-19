export interface ICreatePropertyDto {
    title: string;
    description: string;
    price: number;
    areaSpace: number;
    location: string;
    cityId: number;
    areaId: number;
    rooms: number;
    bathrooms: number;
    finishingLevel: string;
    propertyType: string;
    purpose: string;
    status: string;
    ownerId?: string;
    //////////////////////

}
