import { SpaceType, type Space } from "../../../types";

export const isTaxSpace = (space: Space): boolean => {
  return space.type === SpaceType.ACTION && (space.id === 'income_tax' || space.id === 'luxury');
};

export const calculateTax = (space: Space): number => {
  if (!isTaxSpace(space)) return 0;
  return space.price || 0;
};
