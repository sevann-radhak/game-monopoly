import React from 'react';
import styles from './ColorPicker.module.css';

const AVAILABLE_COLORS = [
  '#dc2626', // Red
  '#1f2937', // Dark Gray/Black
  '#9ca3af', // Gray
  '#78350f', // Brown
  '#16a34a', // Green
  '#2563eb', // Blue
  '#a16207', // Yellow/Brown
  '#ea580c', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
];

interface ColorPickerProps {
  selectedColor: string;
  usedColors: string[];
  onColorSelect: (color: string) => void;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  usedColors,
  onColorSelect,
  disabled = false,
}) => {
  const availableColors = AVAILABLE_COLORS.filter(
    color => !usedColors.includes(color) || color === selectedColor
  );

  return (
    <div className={styles.container}>
      <div className={styles.colorGrid}>
        {availableColors.map(color => {
          const isSelected = color === selectedColor;
          const isUsed = usedColors.includes(color) && !isSelected;

          return (
            <button
              key={color}
              type="button"
              className={`${styles.colorOption} ${isSelected ? styles.selected : ''} ${isUsed ? styles.used : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => !disabled && !isUsed && onColorSelect(color)}
              disabled={disabled || isUsed}
              title={isUsed ? 'Color already in use' : color}
              aria-label={`Select color ${color}`}
            >
              {isSelected && <span className={styles.checkmark}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};


