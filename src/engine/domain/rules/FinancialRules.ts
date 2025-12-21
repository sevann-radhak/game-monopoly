import { PropertyColor, SpaceType, type Space, type Player } from "../../../types";

export const canMortgage = (
    player: Player,
    property: Space,
    board: Space[]
): { canMortgage: boolean; reason?: string } => {
    if (property.owner !== player.id) return { canMortgage: false, reason: "You don't own this" };
    if (property.mortgaged) return { canMortgage: false, reason: "Property is already mortgaged" };
    if ((property.houses || 0) > 0) return { canMortgage: false, reason: "Must sell houses before mortgaging" };

    // Check if any property in the same color group has houses
    if (property.color && property.color !== PropertyColor.NONE) {
        const hasHousesInGroup = board.some(s => 
            s.color === property.color && 
            s.type === SpaceType.PROPERTY && 
            (s.houses || 0) > 0
        );
        if (hasHousesInGroup) return { canMortgage: false, reason: "Must sell all houses in color group before mortgaging" };
    }

    return { canMortgage: true };
};

export const canUnmortgage = (
    player: Player,
    property: Space
): { canUnmortgage: boolean; reason?: string } => {
    if (property.owner !== player.id) return { canUnmortgage: false, reason: "You don't own this" };
    if (!property.mortgaged) return { canUnmortgage: false, reason: "Property is not mortgaged" };

    const unmortgageCost = Math.ceil((property.price || 0) / 2 * 1.1);
    if (player.money < unmortgageCost) return { canUnmortgage: false, reason: `Insufficient funds (Needs $${unmortgageCost})` };

    return { canUnmortgage: true };
};

export const getLiquidationValue = (player: Player, board: Space[]): number => {
    let value = player.money;

    const playerProperties = board.filter(s => s.owner === player.id);
    playerProperties.forEach(prop => {
        // Mortgage value
        if (!prop.mortgaged) {
            value += (prop.price || 0) / 2;
        }

        // House value (50% of cost)
        if ((prop.houses || 0) > 0) {
            value += (prop.houses || 0) * (prop.houseCost || 0) / 2;
        }
    });

    return value;
};
