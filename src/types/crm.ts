export interface GuestResponse {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  identityType: string | null;
  identityNumber: string | null;
  birthDate: string | null;
  nationality: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GuestCreateRequest {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string | null;
  identityType?: string | null;
  identityNumber?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GuestUpdateRequest {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string | null;
  identityType?: string | null;
  identityNumber?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}
