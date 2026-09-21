export const SectionHeading = ({
    title
}: {
    title: string;
    backgroundTitle?: string;
}) => {
    return (
        <div className="mb-8 md:mb-10 mt-2 md:mt-4">
            <h2 className="inline-flex items-center gap-3 text-2xl md:text-3xl font-semibold text-black leading-tight">
                <span className="h-5 w-1 bg-accent" aria-hidden="true" />
                {title}
            </h2>
        </div>
    );
};
