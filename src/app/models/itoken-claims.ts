export interface ITokenClaims {
  nameid: string;
  unique_name: string;
  email: string;
  role: string;
  exp: number;
  jti?: string;
  iat?: number;
}
