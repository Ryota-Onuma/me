import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-6xl md:text-8xl font-black text-black mb-6">404</h1>
            <p className="text-xl md:text-2xl text-black/60 mb-8">
                Page not found
            </p>
            <Link
                href="/"
                className="px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-black/80 transition-colors"
            >
                Go Home
            </Link>
        </div>
    );
}
