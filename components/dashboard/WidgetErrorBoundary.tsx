'use client';

import {Component, type ReactNode} from "react";
import WidgetUnavailable from "@/components/dashboard/WidgetUnavailable";

type Props = {title: string; children: ReactNode};
type State = {failed: boolean};

// One widget failing (a loader thrown inside Suspense or a render error) must
// never take the whole dashboard down.
class WidgetErrorBoundary extends Component<Props, State> {
    state: State = {failed: false};

    static getDerivedStateFromError(): State {
        return {failed: true};
    }

    componentDidCatch(error: unknown) {
        console.error(`Dashboard widget "${this.props.title}" failed:`, error);
    }

    render() {
        if (this.state.failed) return <WidgetUnavailable failed text={`Couldn't load ${this.props.title}.`} />;
        return this.props.children;
    }
}

export default WidgetErrorBoundary;
