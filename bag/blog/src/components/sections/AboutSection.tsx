import Link from 'next/link';
import Image from 'next/image';
import { SOCIAL_LINKS } from '@/data/socialLinks';
import type { ScrapItem } from '@/lib/scraps';
import type { BookItem } from '@/lib/books';
import type { ThemeEntry } from '@/lib/content';

interface UpdateItem {
    id: string;
    type: string;
    title: string;
    date: string;
    href?: string;
    isExternal: boolean;
}

interface AboutSectionProps {
    updates: UpdateItem[];
    scraps: ScrapItem[];
    books: BookItem[];
    blogs: Array<{ id: string; title: string; href: string; isExternal: boolean }>;
    themes: ThemeEntry[];
}

const isRecent = (date: string): boolean => {
    const timestamp = new Date(date).getTime();
    if (Number.isNaN(timestamp)) return false;
    const age = Date.now() - timestamp;
    return age >= 0 && age <= 30 * 24 * 60 * 60 * 1000;
};

const formatDate = (date: string): string => {
    const dateOnly = date.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    if (dateOnly) {
        return `${dateOnly[1]}-${dateOnly[2].padStart(2, '0')}-${dateOnly[3].padStart(2, '0')}`;
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date.slice(0, 10);
    return parsed.toISOString().slice(0, 10);
};

const updateTypeLabel: Record<string, string> = {
    Blog: '技術',
    Scrap: '雑記',
    Library: '読書',
};

export const AboutSection = ({ updates, scraps, books, blogs, themes }: AboutSectionProps) => (
    <section id="about" className="retro-home">
        <div className="retro-home-layout">
            <figure className="retro-profile">
                <Image src="/profile.jpg" alt="自転車に乗る手描きキャラクター" width={320} height={400} priority />
                <figcaption>作者の絵</figcaption>
            </figure>

            <div className="retro-main-column">
                <h1><span lang="en">Ryota Onuma</span>のホームページ</h1>
                <p className="retro-welcome">Welcome to my homepage!</p>
                <p>ソフトウェアエンジニアの<span lang="en">Ryota Onuma</span>です。日々考えたこと、学んだこと、読んだ本を少しずつ置いています。</p>

                <h2>目次</h2>
                <ul className="retro-index">
                    <li>
                        <Link href="/blog">技術ノート</Link> ― 実装の記録と、少し長めの文章です。
                        {updates.some(item => item.type === 'Blog' && isRecent(item.date)) && <span className="new-badge"> NEW</span>}
                    </li>
                    <li><Link href="/scrap">雑記帳</Link> ― 小さな発見や考え途中のメモです。</li>
                    <li><Link href="/library">読書記録</Link> ― 読んだ本と感想をまとめています。</li>
                </ul>

                <h2>いま気になっているテーマ</h2>
                <ul className="retro-theme-picks">
                    {themes.map(theme => (
                        <li key={theme.slug}>
                            <Link href={`/themes/${theme.slug}`}>{theme.label}</Link>
                            <span className="retro-card-meta">（{theme.count} 件）</span>
                        </li>
                    ))}
                </ul>

                <h2>最近の活動</h2>
                <table className="retro-updates">
                    <tbody>
                        {updates.map((item) => (
                            <tr key={item.id}>
                                <td><time dateTime={formatDate(item.date)}>{formatDate(item.date)}</time></td>
                                <td>[{updateTypeLabel[item.type] || item.type}]</td>
                                <td>
                                {!item.isExternal && item.href ? (
                                    <Link href={item.href}>{item.title}</Link>
                                ) : (
                                    <a href={item.href} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                )}
                                {isRecent(item.date) && <span className="new-badge"> NEW!</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="retro-mini-columns">
                    <section>
                        <h2>育てているScrap</h2>
                        <ul>
                            {scraps.filter(scrap => ['open', 'growing', 'evergreen'].includes(scrap.status)).map(scrap => (
                                <li key={scrap.id}><Link href={`/scrap/${scrap.slug}`}>{scrap.title}</Link></li>
                            ))}
                        </ul>
                    </section>
                    <section>
                        <h2>整理したBlog</h2>
                        <ul>
                            {blogs.map(blog => (
                                <li key={blog.id}>
                                    {blog.isExternal ? <a href={blog.href} target="_blank" rel="noopener noreferrer">{blog.title}</a> : <Link href={blog.href}>{blog.title}</Link>}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section>
                        <h2>最近読んだ本</h2>
                        <ul>
                            {books.map(book => (
                                <li key={book.id}>
                                    {book.hasNotes ? <Link href={`/library/${book.slug}`}>{book.title}</Link> : <a href={book.externalUrl} target="_blank" rel="noopener noreferrer">{book.title}</a>}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <h2>外へのリンク</h2>
                <ul>
                    {SOCIAL_LINKS.map((link) => (
                        <li key={link.label}>
                            <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                        </li>
                    ))}
                </ul>

                <div className="retro-notice">
                    <b>お知らせ</b><br />
                    このページは画像を控えめに、なるべく軽く作っています。外部サイトは別のウィンドウで開きます。
                </div>
            </div>
        </div>
    </section>
);
