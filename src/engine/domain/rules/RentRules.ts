import { PropertyColor, SpaceType } from "../../../types";
import type { Space } from "../../../types";

/**
 * Calculates the rent for a given space based on the board state and dice roll.
 * @param space The property space the player landed on.
 * @param board The current state of the board (to check for monopolies).
 * @param diceTotal The total of the dice roll (for Utilities).
 * @returns The calculated rent amount.
 */
export const calculateRent = (space: Space, board: Space[], diceTotal: number): number => {
    if (!space.owner || space.mortgaged) {
        return 0;
    }

    // 1. Utilities (Electric Company, Water Works)
    if (space.type === SpaceType.PROPERTY && space.color === PropertyColor.UTILITY) {
        const ownedUtilities = board.filter(
            s => s.type === SpaceType.PROPERTY && 
                 s.color === PropertyColor.UTILITY && 
                 s.owner === space.owner &&
                 !s.mortgaged
        ).length;

        // Rule: 1 utility = 4x dice, 2 utilities = 10x dice
        const multiplier = ownedUtilities === 2 ? 10 : 4;
        return diceTotal * multiplier;
    }

    // 2. Railroads/Stations
    if (space.type === SpaceType.PROPERTY && space.color === PropertyColor.STATION) {
        const ownedStations = board.filter(
            s => s.type === SpaceType.PROPERTY && 
                 s.color === PropertyColor.STATION && 
                 s.owner === space.owner &&
                 !s.mortgaged
        ).length;

        // Rule: 25, 50, 100, 200 based on count
        // 25 * 2^(n-1) works: 1->25, 2->50, 3->100, 4->200
        return 25 * Math.pow(2, ownedStations - 1);
    }

    // 3. Standard Properties
    if (space.type === SpaceType.PROPERTY && space.rent) {
        // If houses/hotels exist, use the specific rent index
        // 0 = Base, 1 = 1 House, etc.
        const houseCount = space.houses || 0;
        
        if (houseCount > 0) {
           return space.rent[houseCount];
        }

        // Base rent logic (no houses)
        // Check for Monopoly (all properties of same color group owned by same player)
        const colorGroup = board.filter(
            s => s.type === SpaceType.PROPERTY && s.color === space.color
        );
        
        const isMonopoly = colorGroup.every(s => s.owner === space.owner);
        
        // Rule: Double rent if standard monopoly and no houses are built on THAT property
        // (Though typically you can't build if you don't have monopoly, and if you have houses, 
        // you use house rent which is not doubled by this specific rule, it's just higher).
        // The double rent applies to UNIMPROVED properties of a complete color group.
        
        const rentAmount = space.rent[0];
        return isMonopoly ? rentAmount * 2 : rentAmount;
    }

    return 0;
};
