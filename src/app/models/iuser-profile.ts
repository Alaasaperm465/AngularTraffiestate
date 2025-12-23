export interface IUserProfile {
    userId: string;
    userName: string;
    email: string;
    phoneNumber: string;
    role: string;
    bio: string;
    avatarUrl: string;
    propertiesCount: number;
    favoritesCount: number;
    averageRating: number;
}

export interface IUpdateUserDto {
    userName: string;
    phoneNumber: string;
}
