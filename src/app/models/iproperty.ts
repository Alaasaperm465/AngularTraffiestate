export interface IProperty {
    //     id: number;
    // title: string;
    // description: string;
    // price: number;
    // location: string;
    // pathRoomCount:number;
    // RoomsCount:number;
    // FinishLevel:string;
    // purpos:string;
    // type: 'sale' | 'rent';
    // imageUrl:string;
    // images?: string[];
    // sellerId: number;
    // status:string;
    // city?:string;
    // area?:string;
    //******************** */
    id: number;
  title: string;
  description: string;
  price: number;
  areaSpace: number;
  rooms: number;
  bathrooms: number;
  finishingLevel: string;
  propertyType: string;
  purpose: 'Rent' | 'Buy';
  type: 'sale' | 'rent';
  city: string;
  area: string;
  imageUrl: string;
  isAvailable: boolean;
}
