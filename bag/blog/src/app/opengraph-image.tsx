import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ryota.onuma.dev';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fafafa',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span
                        style={{
                            fontSize: 80,
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            color: '#1a1a1a',
                        }}
                    >
                        ryota.onuma
                    </span>
                    <span
                        style={{
                            fontSize: 80,
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            color: '#76b5c5',
                        }}
                    >
                        .dev
                    </span>
                </div>
                <p
                    style={{
                        fontSize: 32,
                        color: '#1a1a1a',
                        opacity: 0.6,
                        marginTop: 24,
                        letterSpacing: '0.1em',
                    }}
                >
                    Stay Curious. Keep Moving.
                </p>
            </div>
        ),
        {
            ...size,
        }
    );
}
