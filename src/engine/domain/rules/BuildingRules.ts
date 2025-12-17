import { PropertyColor, SpaceType, type Space, type Player } from "../../../types";

export const canBuildHouse = (
    player: Player,
    property: Space,
    board: Space[]
): { canBuild: boolean; reason?: string } => {
    // 1. Basic Checks
    if (property.type !== SpaceType.PROPERTY) return { canBuild: false, reason: "Not a property" };
    if (!property.color || property.color === PropertyColor.UTILITY || property.color === PropertyColor.STATION || property.color === PropertyColor.NONE) {
        return { canBuild: false, reason: "Cannot build on this type" };
    }
    if (property.owner !== player.id) return { canBuild: false, reason: "You don't own this" };
    if (property.mortgaged) return { canBuild: false, reason: "Property is mortgaged" };
    
    // 2. Monopoly Check
    const colorGroup = board.filter(s => s.type === SpaceType.PROPERTY && s.color === property.color);
    const ownsAll = colorGroup.every(s => s.owner === player.id);
    if (!ownsAll) return { canBuild: false, reason: "You typically need the whole color group" };

    // 3. Mortgaged dependencies check (Can't build if any in group is mortgaged)
    const anyMortgaged = colorGroup.some(s => s.mortgaged);
    if (anyMortgaged) return { canBuild: false, reason: "Cannot build if any property in group is mortgaged" };

    // 4. Max Houses Check (4 Houses + 1 Hotel = 5 levels)
    const currentHouses = property.houses || 0;
    if (currentHouses >= 5) return { canBuild: false, reason: "Max improvements reached (Hotel)" };

    // 5. Cost Check
    const cost = property.houseCost || 0;
    if (player.money < cost) return { canBuild: false, reason: "Insufficient funds" };

    // 6. Uniformity Rule
    // You must build evenly. You cannot build on this property if its house count is > any other property in the group.
    // i.e., currentHouses must be <= min(others) -> actually, it must be EQUAL to the minimum of the group.
    // Example: [0,0,0] -> Min=0. Current=0. OK. -> Becomes [1,0,0]
    // Example: [1,0,0] -> Min=0. Current=1. 1 > 0 -> No. (Must build on others first)
    // Example: [1,0,0] -> Target is the 0. Min=0. Current=0. OK.
    
    const minHouses = Math.min(...colorGroup.map(s => s.houses || 0));
    const maxHouses = Math.max(...colorGroup.map(s => s.houses || 0)); // Not strictly needed for logic but good for debug
    
    // Allow building if we are at the minimum level
    if (currentHouses > minHouses) {
        return { canBuild: false, reason: "Must build evenly across properties" };
    }

    return { canBuild: true };
};
