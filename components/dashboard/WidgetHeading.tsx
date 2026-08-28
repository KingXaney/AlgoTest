// The h2 every page section uses; kept identical so a dashboard panel matches /portfolio and /brain.
const WidgetHeading = ({children}: {children: React.ReactNode}) => (
    <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-brand mb-4" style={{fontFamily: 'var(--type-mono)'}}>
        {children}
    </h2>
);

export default WidgetHeading;
