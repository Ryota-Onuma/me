import { Github } from 'lucide-react';
import { XIcon } from '../components/icons';

interface SocialLink {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const SOCIAL_LINKS: SocialLink[] = [
    {
        label: 'GitHub',
        href: 'https://github.com/Ryota-Onuma',
        icon: Github,
    },
    {
        label: 'X',
        href: 'https://x.com/and_and_and30',
        icon: XIcon,
    },
];
