import React from 'react';
const ALERT_STYLES = {
    NOTE: {
        label: 'Note'
    },
    TIP: {
        label: 'Tip'
    },
    IMPORTANT: {
        label: 'Important'
    },
    WARNING: {
        label: 'Warning'
    },
    CAUTION: {
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

    return (
        <aside className={`retro-alert retro-alert-${type.toLowerCase()}`}>
            <p><b>［{styles.label}］</b></p>
            <div>{cleanChildren(children)}</div>
        </aside>
    );
};

export const getAlertType = (children: React.ReactNode): AlertType | null => {
    const content = findText(children).trim();
    const match = content.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
    return match ? (match[1] as AlertType) : null;
};
