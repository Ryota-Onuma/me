import { ARCHIVE_SECTIONS, type ArchiveSectionKey } from '@/data/site';

export const SectionHeading = ({
    section,
}: {
    section: Exclude<ArchiveSectionKey, 'about'>;
}) => {
    const item = ARCHIVE_SECTIONS[section];
    return (
        <header className={`retro-section-heading retro-section-${section}`}>
            <h1 id={`${section}-heading`}>{item.title}</h1>
        </header>
    );
};
