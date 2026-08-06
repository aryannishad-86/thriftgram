export default function SkeletonCard() {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-[4/5] animate-pulse bg-base-2" />
        </div>
    );
}
