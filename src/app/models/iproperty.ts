export interface IProperty {
    id: number;
    title: string;
    description: string;
    price: number;
    location: string;
    pathRoomCount:number;
    RoomsCount:number;
    FinishLevel:string;
    purpos:string;
    type: 'sale' | 'rent';
    imageUrl:string;
    images?: string[];
    sellerId: number;
    status:string;
    city?:string;
    area?:string;
}
