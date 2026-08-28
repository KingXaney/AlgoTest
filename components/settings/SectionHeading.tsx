// The h2 treatment every page section uses (see /portfolio, /brain).
const SectionHeading = ({children}: {children: React.ReactNode}) => (
    <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-brand mb-4" style={{fontFamily: 'var(--type-mono)'}}>
        {children}
    </h2>
);

export default SectionHeading;
