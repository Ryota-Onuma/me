import { ReactNode } from 'react';

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
}

/**
 * MagneticButton - マグネティック・インタラクション
 */
export const MagneticButton = ({ children, className = "" }: MagneticButtonProps) => {
    return (
        <div className={className}>
            {children}
        </div>
    );
};
