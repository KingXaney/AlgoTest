import type {WidgetDefinition, WidgetSpan} from "@/lib/dashboard/widgets";

// Lightweight drag preview — never a clone of the body (that would double-mount embeds).
const DragGhost = ({def, span, width}: {def: WidgetDefinition; span: WidgetSpan; width?: number}) => (
    <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl ring-1 ring-brand/60 cursor-grabbing"
         style={{width: width ? Math.min(width, 360) : undefined}}>
        <span className="material-symbols-outlined text-brand">{def.icon}</span>
        <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-fg truncate" style={{fontFamily: 'var(--type-mono)'}}>{def.title}</div>
            <div className="text-[10px] text-fg-muted" style={{fontFamily: 'var(--type-mono)'}}>{span} of 12 columns</div>
        </div>
    </div>
);

export default DragGhost;
