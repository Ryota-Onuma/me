import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { WorkCard } from '../ui/WorkCard';
import { contents } from '../../data/contents';

/**
 * WorksSection - Works & Articlesセクション (統合)
 */
export const WorksSection = () => {
    const navigate = useNavigate();

    return (
        <section id="works" className="py-20 md:py-40 px-6 md:px-24 bg-[#050505]">
            <div className="relative mb-20 md:mb-32">
                <div className="absolute -top-12 md:-top-20 left-0">
                    <h2 className="text-7xl sm:text-9xl md:text-[14rem] font-black tracking-[-0.08em] italic uppercase text-white/[0.03] select-none leading-none pointer-events-none">
                        Works
                    </h2>
                </div>

                <div className="relative z-10 flex items-center gap-6 pt-8">
                    <div className="flex flex-col">
                        <span className="text-sm md:text-base tracking-[0.6em] text-white uppercase font-black italic leading-none">
                            Works
                        </span>
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '100%' }}
                            transition={{ duration: 1, ease: "circOut", delay: 0.5 }}
                            className="h-[3px] bg-gradient-to-r from-white via-white/50 to-transparent mt-3"
                        />
                    </div>
                    <div className="hidden md:block w-32 h-px bg-gradient-to-r from-white/20 to-transparent" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {contents.map((item) => (
                    <motion.div
                        key={item.id}
                        className=""
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div
                            onClick={() => {
                                if (item.type === 'internal' && item.slug) {
                                    navigate(`/blog/${item.slug}`);
                                } else if (item.url) {
                                    window.open(item.url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                            className="cursor-pointer"
                        >
                            <WorkCard
                                title={item.title}
                                category={item.category}
                                description={item.description}
                                date={item.date}
                                tags={item.tags}
                                thumbnail={item.thumbnail}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
