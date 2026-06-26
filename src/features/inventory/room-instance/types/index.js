/**
 * @typedef {Object} RoomInstanceResponse
 * @property {number} id
 * @property {number} hotelId
 * @property {number} hotelRoomTypeId
 * @property {string} roomNumber
 * @property {'READY' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'} currentStatus
 */

export const ROOM_STATUSES = ['READY', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
