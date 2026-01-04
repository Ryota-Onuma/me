import React, { memo } from 'react';
import { Info, Lightbulb, Zap, AlertTriangle, AlertCircle } from 'lucide-react';

const ALERT_STYLES = {
    NOTE: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50/50', border: 'border-blue-200', label: 'Note' },
    TIP: { icon: Lightbulb, color: 'text-green-500', bg: 'bg-green-50/50', border: 'border-green-200', label: 'Tip' },
    IMPORTANT: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50/50', border: 'border-purple-200', label: 'Important' },
    WARNING: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-200', label: 'Warning' },
    CAUTION: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50/50', border: 'border-red-200', label: 'Caution' },
} as const;

export type AlertType = keyof typeof ALERT_STYLES;

interface AlertBlockProps {
    type: AlertType;
    children: React.ReactNode;
}

// Type for React element props with children
interface PropsWithChildren {
    children?: React.ReactNode;
}

const findText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (React.isValidElement<PropsWithChildren>(node) && node.props.children) {
        return findText(node.props.children);
    }
    if (Array.isArray(node)) return node.map(findText).join('');
    return '';
};

const cleanChildren = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (node) => {
        if (typeof node === 'string') {
            return node.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, '');
        }
        if (React.isValidElement<PropsWithChildren>(node) && node.props.children) {
            return React.cloneElement(
                node,
                undefined,
                cleanChildren(node.props.children)
            );
        }
        return node;
    });
};

const AlertBlockInner: React.FC<AlertBlockProps> = ({ type, children }) => {
    const styles = ALERT_STYLES[type];
    const Icon = styles.icon;

    return (
        <div className={`my-6 p-4 rounded-xl border-l-4 ${styles.bg} ${styles.border} transition-all duration-300`}>
            <div className={`flex items-center gap-2 mb-2 ${styles.color} font-bold uppercase tracking-widest text-[10px]`}>
                <Icon size={14} />
                <span>{styles.label}</span>
            </div>
            <div className="text-black/80 prose-sm md:prose-base leading-relaxed">
                {cleanChildren(children)}
            </div>
        </div>
    );
};

// Memoize to prevent re-renders when parent re-renders
export const AlertBlock = memo(AlertBlockInner);

export const getAlertType = (children: React.ReactNode): AlertType | null => {
    const content = findText(children).trim();
    const match = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
    return match ? (match[1] as AlertType) : null;
};
