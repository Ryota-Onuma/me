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
        <section id="works" className="py-32 md:py-64 px-6 md:px-24 bg-[#050505]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 md:mb-40 gap-8">
                <h2 className="text-6xl sm:text-8xl md:text-[12rem] font-black tracking-[-0.07em] italic uppercase text-white/10 select-none leading-none mix-blend-overlay">
                    Works
                </h2>
                <span className="text-[10px] md:text-xs tracking-[0.6em] text-white/70 uppercase font-black mb-0 md:mb-6 italic">
                    Articles & Thoughts
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 md:gap-y-32">
                {contents.map((item, i) => (
                    <motion.div
                        key={item.id}
                        className={i % 2 === 1 ? 'md:mt-32' : ''}
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
