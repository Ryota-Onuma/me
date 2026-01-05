import React from 'react';
import { Info, Lightbulb, Zap, AlertTriangle, AlertCircle } from 'lucide-react';

const ALERT_STYLES = {
    NOTE: {
        icon: Info,
        color: 'text-[#76b5c5]', // Bianchi Celeste
        bg: 'bg-[#76b5c5]/5',
        border: 'border-[#76b5c5]/20',
        label: 'Note'
    },
    TIP: {
        icon: Lightbulb,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Tip'
    },
    IMPORTANT: {
        icon: Zap,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        label: 'Important'
    },
    WARNING: {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'Warning'
    },
    CAUTION: {
        icon: AlertCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        label: 'Caution'
    },
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
                node as React.ReactElement,
                undefined,
                cleanChildren(node.props.children)
            );
        }
        return node;
    });
};

export const AlertBlock: React.FC<AlertBlockProps> = ({ type, children }) => {
    const styles = ALERT_STYLES[type];
    const Icon = styles.icon;

    return (
        <div className={`my-8 p-5 rounded-2xl border ${styles.bg} ${styles.border} shadow-sm transition-all duration-300`}>
            <div className={`flex items-center gap-2 mb-3 ${styles.color} font-black uppercase tracking-[0.2em] text-[11px]`}>
                <Icon size={16} strokeWidth={3} />
                <span>{styles.label}</span>
            </div>
            <div className="text-black/80 prose-sm md:prose-base leading-[1.8]">
                {cleanChildren(children)}
            </div>
        </div>
    );
};

export const getAlertType = (children: React.ReactNode): AlertType | null => {
    const content = findText(children).trim();
    const match = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
    return match ? (match[1] as AlertType) : null;
};

