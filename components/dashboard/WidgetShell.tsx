'use client';

import Link from "next/link";
import {type KeyboardEvent, type ReactNode} from "react";
import {useSortable} from "@dnd-kit/sortable";
import {ChevronLeft, ChevronRight, GripVertical, X} from "lucide-react";
import {cn} from "@/lib/utils";
import type {WidgetDefinition, WidgetSpan} from "@/lib/dashboard/widgets";
import WidgetHeading from "@/components/dashboard/WidgetHeading";
import SpanPicker from "@/components/dashboard/SpanPicker";

type Props = {
    def: WidgetDefinition;
    span: WidgetSpan;
    editing: boolean;
    index: number;
    count: number;
    className?: string;
    children: ReactNode;
    onSpan: (span: WidgetSpan) => void;
    onRemove: () => void;
    onMoveBy: (delta: number) => void;
    onMoveTo: (index: number) => void;
};

const PANEL_PADDING: Record<WidgetDefinition['chrome'], string> = {
    link: 'p-5',
    panel: 'p-5',
    'panel-lg': 'p-6',
    'panel-sm': 'p-3',
    bare: '',
};

const Eyebrow = ({children}: {children: ReactNode}) => (
    <div className="text-[10px] uppercase tracking-[0.14em] text-fg-muted mb-3" style={{fontFamily: 'var(--type-mono)'}}>{children}</div>
);

const iconButton = 'inline-flex items-center justify-center size-7 rounded-md text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:hover:bg-transparent';

const WidgetShell = ({def, span, editing, index, count, className, children, onSpan, onRemove, onMoveBy, onMoveTo}: Props) => {
    // Transforms are never applied: the DOM only changes on drop (see DashboardGrid).
    const {setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging, over, active} =
        useSortable({id: def.id, disabled: !editing, transition: null});
    const isDropTarget = editing && !!active && over?.id === def.id && active.id !== def.id;

    // React re-inserts the moved node, which drops focus to <body>; put it back on
    // the control that triggered the move so repeated presses keep working.
    const refocus = (elementId: string) => requestAnimationFrame(() => document.getElementById(elementId)?.focus());
    const handleId = `widget-handle-${def.id}`;
    const earlierId = `widget-earlier-${def.id}`;
    const laterId = `widget-later-${def.id}`;
    const moveBy = (delta: number, focusId: string) => { onMoveBy(delta); refocus(focusId); };

    // Keyboard equivalent of dragging, on the handle itself.
    const onHandleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        const moves: Record<string, () => void> = {
            ArrowLeft: () => onMoveBy(-1), ArrowUp: () => onMoveBy(-1),
            ArrowRight: () => onMoveBy(1), ArrowDown: () => onMoveBy(1),
            Home: () => onMoveTo(0), End: () => onMoveTo(count - 1),
        };
        const move = moves[e.key];
        if (!move) return;
        e.preventDefault();
        move();
        refocus(handleId);
    };

    if (!editing) {
        const body = def.chrome === 'link' && def.showTitle ? <><Eyebrow>{def.title}</Eyebrow>{children}</> : children;
        return (
            <div ref={setNodeRef} className={className} data-widget-id={def.id}>
                {def.chrome === 'link' && def.href ? (
                    <Link href={def.href} className="glass-panel rounded-xl p-5 block transition-colors hover:border-brand/25">
                        {body}
                    </Link>
                ) : def.chrome === 'bare' ? (
                    children
                ) : (
                    <section className={cn('glass-panel rounded-xl', PANEL_PADDING[def.chrome])}>
                        {def.chrome === 'panel' && def.showTitle && <WidgetHeading>{def.title}</WidgetHeading>}
                        {children}
                    </section>
                )}
            </div>
        );
    }

    return (
        <div ref={setNodeRef} className={className} data-widget-id={def.id}>
            <div className={cn(
                'rounded-xl ring-1 ring-brand/25 transition-shadow',
                def.chrome === 'bare' ? 'p-0' : cn('glass-panel', PANEL_PADDING[def.chrome]),
                isDragging && 'opacity-40',
                isDropTarget && 'ring-2 ring-brand/70',
            )}>
                <div className={cn('flex items-center justify-between gap-2 flex-wrap', def.chrome === 'bare' ? 'glass-panel rounded-t-xl px-4 py-2.5' : 'mb-3')}>
                    <div className="flex items-center gap-2 min-w-0">
                        <button id={handleId} ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} onKeyDown={onHandleKeyDown}
                                aria-label={`Move ${def.title}. Use the arrow keys to reorder.`}
                                className="hidden md:inline-flex cursor-grab active:cursor-grabbing text-fg-muted hover:text-fg"
                                style={{touchAction: 'none'}}>
                            <GripVertical className="size-4" />
                        </button>
                        <span className="material-symbols-outlined text-base text-brand">{def.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-fg truncate" style={{fontFamily: 'var(--type-mono)'}}>{def.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <SpanPicker spans={def.spans} value={span} onChange={onSpan} />
                        <button id={earlierId} type="button" onClick={() => moveBy(-1, index - 1 === 0 ? handleId : earlierId)} disabled={index === 0} aria-label="Move earlier" className={iconButton}>
                            <ChevronLeft className="size-4" />
                        </button>
                        <button id={laterId} type="button" onClick={() => moveBy(1, index + 1 === count - 1 ? handleId : laterId)} disabled={index === count - 1} aria-label="Move later" className={iconButton}>
                            <ChevronRight className="size-4" />
                        </button>
                        <button type="button" onClick={onRemove} aria-label={`Remove ${def.title}`} className={cn(iconButton, 'hover:text-negative')}>
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
                {/* inert: nothing inside (buy buttons, iframes, links) reacts while arranging */}
                <div inert className={cn(def.chrome === 'bare' && 'pt-2', 'select-none')}>
                    {def.chrome === 'link' && def.showTitle && <Eyebrow>{def.title}</Eyebrow>}
                    {def.chrome === 'panel' && def.showTitle && <WidgetHeading>{def.title}</WidgetHeading>}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default WidgetShell;
