import Image from 'next/image';
import { ARCHIVE_SECTIONS, type ArchiveSectionKey } from '@/data/site';

export const SectionHeading = ({
    section,
}: {
    section: Exclude<ArchiveSectionKey, 'about'>;
}) => {
    const item = ARCHIVE_SECTIONS[section];
    return (
        <header className={`retro-section-heading retro-section-${section}`}>
            <div>
                <p className="retro-kicker">COLLECTION / {item.accessionPrefix}</p>
                <h1 id={`${section}-heading`}>{item.title}</h1>
                <p>{item.subtitle}</p>
            </div>
            <Image src={item.illustration} alt="" width={320} height={240} sizes="160px" priority />
        </header>
    );
};
