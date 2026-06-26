/**
 * @typedef {Object} HotelRoomTypeResponse
 * @property {number} id
 * @property {number} hotelId
 * @property {number} roomTypeId
 * @property {number} standardAdults
 * @property {number} standardChildren
 * @property {number} maxAdults
 * @property {number} maxChildren
 * @property {number} maxInfants
 * @property {number} maxTotalGuests
 * @property {number} maxExtraBeds
 * @property {number} basePrice
 * @property {number} totalQuantity
 * @property {'ACTIVE' | 'INACTIVE'} status
 */

/**
 * @typedef {Object} HotelRoomTypeBedResponse
 * @property {number} roomBedId
 * @property {string} bedName
 * @property {number} quantity
 */

/**
 * @typedef {Object} HotelRoomTypeFeatureResponse
 * @property {number} roomFeatureId
 * @property {string} featureName
 */

/**
 * @typedef {Object} HotelRoomTypeCatalogItemResponse
 * @property {number} catalogItemId
 * @property {string} itemName
 * @property {'MANDATORY' | 'OPTIONAL'} itemUsage
 * @property {number} price
 */
export const ACTIVE_STATUSES = ['ACTIVE', 'INACTIVE'];
