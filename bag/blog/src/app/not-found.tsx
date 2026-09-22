import Link from 'next/link';
import { ClientLayout } from './ClientLayout';

export default function NotFound() {
    return (
        <ClientLayout>
            <main id="main-content" className="retro-not-found" tabIndex={-1}>
                <div>
                    <h1>ページが見つかりません。</h1>
                    <p><Link href="/">← トップページへ戻る</Link></p>
                </div>

            </main>
        </ClientLayout>
    );
}
