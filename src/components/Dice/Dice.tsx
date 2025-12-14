import React from 'react';
import classNames from 'classnames';
import styles from './Dice.module.css';

interface DiceProps {
  value: number; // 1-6
  isRolling: boolean;
}

export const Dice: React.FC<DiceProps> = ({ value, isRolling }) => {
    // Determine the class based on value
    const getFaceClass = (val: number) => {
        switch(val) {
            case 1: return styles.show1;
            case 2: return styles.show2;
            case 3: return styles.show3;
            case 4: return styles.show4;
            case 5: return styles.show5;
            case 6: return styles.show6;
            default: return styles.show1;
        }
    };

    return (
        <div className={styles.scene}>
            {/* Wrapper handles the physical path (Throw/Bounce) */}
            <div className={classNames(styles.physicsWrapper, { [styles.thrown]: isRolling })}>
                {/* Cube handles the rotation */}
                <div className={classNames(styles.cube, { [styles.rolling]: isRolling }, getFaceClass(value))}>
                    <div className={classNames(styles.face, styles.front)}>1</div>
                    <div className={classNames(styles.face, styles.back)}>2</div>
                    <div className={classNames(styles.face, styles.right)}>3</div>
                    <div className={classNames(styles.face, styles.left)}>4</div>
                    <div className={classNames(styles.face, styles.top)}>5</div>
                    <div className={classNames(styles.face, styles.bottom)}>6</div>
                </div>
            </div>
        </div>
    );
};
