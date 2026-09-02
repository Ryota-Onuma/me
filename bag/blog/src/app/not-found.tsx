import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="site-shell">
            <main className="retro-not-found">
                <p className="retro-kicker">ERROR 404</p>
                <h1>404 Not Found</h1>
                <hr />
                <p>お探しのページは見つかりませんでした。</p>
                <p><Link href="/">← ホームページへ戻る</Link></p>
                <hr />
                <p><small>ryota.onuma.dev</small></p>
            </main>
        </div>
    );
}
