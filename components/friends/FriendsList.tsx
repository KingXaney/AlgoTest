'use client';

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {removeFriend} from "@/lib/actions/friends.actions";

const FriendsList = ({friends}: {friends: FriendSummary[]}) => {
    const router = useRouter();
    const [busyId, setBusyId] = useState<string | null>(null);

    const onRemove = async (friendshipId: string) => {
        if (busyId) return;
        setBusyId(friendshipId);
        try {
            const result = await removeFriend(friendshipId);
            if (result.success) {
                toast.success(result.message || 'Removed');
                router.refresh();
            } else {
                toast.error(result.message || 'Failed');
            }
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="glass-panel rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-brand mb-3" style={{fontFamily: 'var(--type-mono)'}}>
                Your Friends ({friends.length})
            </h2>
            {friends.length === 0 ? (
                <p className="text-sm text-fg-muted">No friends yet — add someone by email to compete.</p>
            ) : (
                <div className="space-y-2">
                    {friends.map((f) => (
                        <div key={f.friendshipId}
                             className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-surface-2/40 border-line-strong/20">
                            <Link href={`/friends/${f.id}`} className="group flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                     style={{backgroundColor: 'var(--brand-strong)', color: 'var(--on-brand)', fontFamily: 'var(--type-display)'}}>
                                    {f.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-fg group-hover:text-brand transition-colors truncate">{f.name}</div>
                                    <div className="text-[11px] text-fg-muted truncate">{f.email}</div>
                                </div>
                            </Link>
                            <button
                                type="button"
                                onClick={() => onRemove(f.friendshipId)}
                                disabled={busyId === f.friendshipId}
                                title="Remove friend"
                                className="p-1.5 rounded text-fg-muted hover:text-negative transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-base">person_remove</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendsList;
