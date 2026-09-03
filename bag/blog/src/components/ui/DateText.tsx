export function DateText({ value, fallback = '未登録' }: { value?: string; fallback?: string }) {
    if (!value) return <>{fallback}</>;
    return <time dateTime={value}>{value}</time>;
}
