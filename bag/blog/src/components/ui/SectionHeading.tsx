export const SectionHeading = ({
    title,
    backgroundTitle
}: {
    title: string;
    backgroundTitle?: string;
}) => {
    return (
        <div className="relative mb-16 md:mb-24 mt-8 md:mt-16">
            <div className="absolute -top-8 md:-top-24 left-0">
                <h2 className="text-7xl sm:text-9xl md:text-[18rem] font-black tracking-[-0.08em] italic uppercase text-black/[0.03] select-none leading-none pointer-events-none whitespace-nowrap">
                    {backgroundTitle || title}
                </h2>
            </div>

            <div className="relative z-10 flex items-center gap-6 pt-8">
                <div className="flex flex-col">
                    <span className="text-lg md:text-2xl tracking-[0.6em] text-black uppercase font-black italic leading-none pl-1 group-hover:text-accent transition-colors duration-500">
                        {title}
                    </span>
                    <div className="h-[3px] bg-gradient-to-r from-accent via-accent/50 to-transparent mt-4 animate-width-expand origin-left" />
                </div>
                <div className="hidden md:block w-32 h-px bg-gradient-to-r from-accent/30 to-transparent" />
            </div>
        </div>
    );
};
