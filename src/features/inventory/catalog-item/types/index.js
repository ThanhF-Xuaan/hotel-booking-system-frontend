/**
 * @typedef {Object} CatalogItem
 * @property {number} id
 * @property {number} hotelId
 * @property {string} name
 * @property {'ROOM_AMENITY' | 'ROOM_SERVICE' | 'FOOD' | 'SUGARY_DRINK' | 'NORMAL_NON_ALCOHOLIC_DRINK' | 'ALCOHOLIC_DRINK' | 'EXTRA_BED' | 'OTHER'} itemType
 * @property {number} vatRuleId
 * @property {number} basePrice
 * @property {'ACTIVE' | 'INACTIVE'} status
 */

export const ITEM_TYPES = [
  'ROOM_AMENITY',
  'ROOM_SERVICE',
  'FOOD',
  'SUGARY_DRINK',
  'NORMAL_NON_ALCOHOLIC_DRINK',
  'ALCOHOLIC_DRINK',
  'EXTRA_BED',
  'OTHER'
];
