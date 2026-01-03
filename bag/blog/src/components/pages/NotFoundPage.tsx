import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
    return (
        <main className="min-h-screen flex items-center justify-center px-6 py-20 bg-[#fafafa]">
            <div className="text-center max-w-lg animate-fade-in-up">
                {/* 404 Number */}
                <div className="relative mb-8">
                    <span className="text-[12rem] md:text-[16rem] font-black tracking-tighter leading-none text-black/5 select-none">
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl md:text-8xl font-black tracking-tighter text-black">
                            404
                        </span>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-4 text-black">
                    ページが見つかりません
                </h1>
                <p className="text-black/50 text-base md:text-lg mb-10 leading-relaxed">
                    お探しのページは存在しないか、<br className="hidden md:block" />
                    移動した可能性があります。
                </p>

                {/* Navigation Links */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="group flex items-center gap-3 px-8 py-4 rounded-full bg-accent text-white font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(118,181,197,0.4)]"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-3 px-8 py-4 rounded-full bg-transparent border border-black/10 text-black/60 font-bold uppercase tracking-widest text-xs transition-all hover:border-accent/40 hover:text-accent hover:scale-105"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>戻る</span>
                    </button>
                </div>
            </div>
        </main>
    );
};
