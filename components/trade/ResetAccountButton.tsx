'use client';

import {useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {resetPaperAccount} from "@/lib/actions/trading.actions";

// Resets one strategy account back to the $100k starting balance
// (clears its positions, trade history and performance snapshots).
const ResetAccountButton = ({accountId}: {accountId: string}) => {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const onReset = async () => {
        if (!confirming) { setConfirming(true); return; }
        setBusy(true);
        try {
            const result = await resetPaperAccount(accountId);
            if (result.success) {
                toast.success(result.message || 'Strategy reset');
                router.refresh();
            } else {
                toast.error(result.message || 'Reset failed');
            }
        } finally {
            setBusy(false);
            setConfirming(false);
        }
    };

    return (
        <button
            type="button"
            onClick={onReset}
            onBlur={() => setConfirming(false)}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-fg-soft hover:text-negative transition-colors disabled:opacity-50"
            style={{border: '1px solid color-mix(in srgb, var(--line-strong) 40%, transparent)', fontFamily: 'var(--type-mono)'}}
        >
            {busy ? 'Resetting…' : confirming ? 'Click to confirm' : 'Reset Strategy'}
        </button>
    );
};

export default ResetAccountButton;
