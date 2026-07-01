export interface HotelResponse {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoomTypeResponse {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface HotelRoomTypeResponse {
  id: number;
  hotelId: number;
  roomTypeId: number;
  standardAdults: number;
  standardChildren: number;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  maxTotalGuests: number;
  maxExtraBeds: number;
  maxBeds: number;
  basePrice: number;
  totalQuantity: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface HotelRoomTypeBedResponse {
  roomBedId: number;
  bedName: string;
  quantity: number;
}

export interface HotelRoomTypeFeatureResponse {
  roomFeatureId: number;
  featureName: string;
}

export interface HotelRoomTypeCatalogItemResponse {
  catalogItemId: number;
  itemName: string;
  itemUsage: 'MANDATORY' | 'OPTIONAL';
  price: number;
}

export interface CatalogItemResponse {
  id: number;
  hotelId: number;
  name: string;
  itemType: 'ROOM_AMENITY' | 'ROOM_SERVICE' | 'FOOD' | 'SUGARY_DRINK' | 'NORMAL_NON_ALCOHOLIC_DRINK' | 'ALCOHOLIC_DRINK' | 'EXTRA_BED' | 'OTHER';
  taxCategoryId: number;
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CatalogItemCreateRequest {
  hotelId: number;
  name: string;
  itemType: 'ROOM_AMENITY' | 'ROOM_SERVICE' | 'FOOD' | 'SUGARY_DRINK' | 'NORMAL_NON_ALCOHOLIC_DRINK' | 'ALCOHOLIC_DRINK' | 'EXTRA_BED' | 'OTHER';
  taxCategoryId: number;
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CatalogItemUpdateRequest {
  name: string;
  itemType: 'ROOM_AMENITY' | 'ROOM_SERVICE' | 'FOOD' | 'SUGARY_DRINK' | 'NORMAL_NON_ALCOHOLIC_DRINK' | 'ALCOHOLIC_DRINK' | 'EXTRA_BED' | 'OTHER';
  taxCategoryId: number;
  basePrice: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoomInstanceResponse {
  id: number;
  hotelId: number;
  hotelRoomTypeId: number;
  roomNumber: string;
  currentStatus: 'READY' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
}

export interface RoomInstanceCreateRequest {
  hotelId: number;
  hotelRoomTypeId: number;
  roomNumber: string;
  currentStatus: 'READY' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
}

export interface RoomInstanceUpdateRequest {
  hotelRoomTypeId: number;
  roomNumber: string;
  currentStatus: 'READY' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
}

export const ACTIVE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export const ITEM_TYPES = [
  'ROOM_AMENITY',
  'ROOM_SERVICE',
  'FOOD',
  'SUGARY_DRINK',
  'NORMAL_NON_ALCOHOLIC_DRINK',
  'ALCOHOLIC_DRINK',
  'EXTRA_BED',
  'OTHER'
] as const;

export const ROOM_STATUSES = ['READY', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'] as const;

export interface RoomBedResponse {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoomFeatureResponse {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}
