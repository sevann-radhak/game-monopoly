/**
 * Pure functions for movement logic
 */

export const rollDice = (): [number, number] => {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return [die1, die2];
};

export const isDouble = (dice: [number, number]): boolean => {
  return dice[0] === dice[1];
};

export const calculateNewPosition = (currentPosition: number, spacesToMove: number): { position: number; passedGo: boolean } => {
  const newRawPosition = currentPosition + spacesToMove;
  const position = newRawPosition % 40;
  const passedGo = newRawPosition >= 40;
  
  return { position, passedGo };
};
