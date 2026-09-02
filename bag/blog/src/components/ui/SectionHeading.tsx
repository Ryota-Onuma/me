export const SectionHeading = ({
    title,
}: {
    title: string;
    backgroundTitle?: string;
}) => {
    return (
        <div className="retro-section-heading">
            <h1>{title}</h1>
            <hr />
            <p>ryota.onuma.dev ― {title}</p>
        </div>
    );
};
