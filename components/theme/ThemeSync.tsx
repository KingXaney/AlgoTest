'use client';

import {useEffect, useRef, useTransition} from "react";
import {useRouter} from "next/navigation";
import {useTheme} from "@/components/theme/ThemeProvider";
import {themeEquals, type Theme} from "@/lib/theme/resolve";
import {adoptAppearanceCookie} from "@/lib/actions/appearance.actions";

// On a device where the cookie is missing or stale (first visit, or a theme
// changed elsewhere), adopt the account's saved theme. Decided once per mount:
// later commits update the cookie themselves, so re-checking would only add
// redundant round-trips.
const ThemeSync = ({dbTheme}: {dbTheme: Theme | null}) => {
    const {theme} = useTheme();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const decided = useRef(false);

    useEffect(() => {
        if (decided.current) return;
        decided.current = true;
        if (!dbTheme || themeEquals(dbTheme, theme)) return;
        startTransition(async () => {
            const result = await adoptAppearanceCookie();
            if (result.success) router.refresh();
        });
    }, [dbTheme, theme, router]);

    return null;
};

export default ThemeSync;
