import Link from 'next/link';
import Image from 'next/image';
import { ClientLayout } from './ClientLayout';

export default function NotFound() {
    return (
        <ClientLayout>
            <main id="main-content" className="retro-not-found" tabIndex={-1}>
                <div>
                    <p className="retro-kicker">ERROR / 404</p>
                    <h1>空の引き出しでした。</h1>
                    <p>お探しの資料は、この番号では収蔵されていないようです。</p>
                    <p><Link href="/">← 資料室の入口へ戻る</Link></p>
                </div>
                <Image
                    src="/illustrations/empty-drawer.png"
                    alt="空の引き出しをのぞき込む手描きのキャラクター"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 700px) 90vw, 520px"
                    priority
                />
            </main>
        </ClientLayout>
    );
}
