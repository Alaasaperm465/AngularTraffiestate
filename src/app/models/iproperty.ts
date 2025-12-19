// src/app/models/iproperty.ts
export interface IProperty {
    
  id: number;
  title: string;
  description: string;
  price: number;
  areaSpace: number;
  isAvailable: boolean;
  location: string;
  reviews?: string;
  rooms: number;
  bathrooms: number;
  finishingLevel: string;
  propertyType: string;
  purpose: string;
  isDeleted: boolean;
  status?: string; // أو نوع Status اللي هتعمله
  views: number;
  isFeatured: boolean;
  approvalStatus?: string; // أو نوع ApprovalStatus
  city?: string;
  area?: string;
  cityId?: number;
  areaId?: number;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;

  imageUrl?: string;
  images?: string[];
  additionalImages?: string[];

  // helper fields for Angular
  phone?: string;       // نفس الرقم زي OwnerPhone
  whatsapp?: string;    // نفس الرقم زي OwnerPhone
  isFavorite?: boolean; // لإدارة المفضلة في الـ frontend
  CreatedAt?: Date;
 
}
export const phone: string = '+20115851932';
export const Call: string = '+20115851932';
export const email: string = 'abrarbadr02@gmail.com';
