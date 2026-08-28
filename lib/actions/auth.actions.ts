'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {cookies, headers} from "next/headers";
import {THEME_COOKIE} from "@/lib/theme/resolve";
import {syncThemeCookieForUser} from "@/lib/actions/appearance.actions";

// Better-auth throws APIError-shaped objects with body.message; fall back to .message or a generic string.
const extractAuthError = (e: unknown, fallback: string): string => {
    if (e && typeof e === 'object') {
        const anyErr = e as { body?: {message?: string}; message?: string };
        return anyErr.body?.message || anyErr.message || fallback;
    }
    return fallback;
}

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
            }).catch((e) => console.log('Failed to queue welcome email', e))
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: extractAuthError(e, 'Sign up failed') }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })
        if (response?.user?.id) {
            await syncThemeCookieForUser(response.user.id).catch((e) => console.error('Theme cookie sync failed', e));
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: extractAuthError(e, 'Invalid email or password') }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
        (await cookies()).delete(THEME_COOKIE);
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}