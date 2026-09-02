import { Header, Footer } from '@/components/layout';

interface ClientLayoutProps {
    children: React.ReactNode;
    activePath?: string;
}

export function ClientLayout({ children, activePath }: ClientLayoutProps) {
    return (
        <div className="site-shell">
            <Header activePath={activePath} />
            {children}
            <Footer />
        </div>
    );
}
