export interface PermissionResponse {
  id: number;
  action: string;
  resource: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PermissionCreateRequest {
  action: string;
  resource: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PermissionUpdateRequest {
  action: string;
  resource: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoleResponse {
  id: number;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoleCreateRequest {
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoleUpdateRequest {
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StaffResponse {
  id: number;
  publicId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  hotelId: number;
  hotelName: string | null;
  roleId: number;
  roleName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface StaffCreateRequest {
  username: string;
  password?: string;
  firstName?: string | null;
  lastName?: string | null;
  hotelId: number;
  roleId: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StaffUpdateRequest {
  firstName?: string | null;
  lastName?: string | null;
  roleId: number;
  status: 'ACTIVE' | 'INACTIVE';
  password?: string;
}
