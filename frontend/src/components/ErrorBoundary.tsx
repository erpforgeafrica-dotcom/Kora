import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const RUNTIME_RECOVERY_KEY = "kora_runtime_recovery_attempted";
const RECOVERABLE_RUNTIME_PATTERNS = [
  /Cannot read properties of null \(reading ['"]useState['"]\)/i,
  /useAuthContext must be used within AuthProvider/i,
  /Invalid hook call/i,
];

function isRecoverableRuntimeError(error: Error | null) {
  const message = error?.message ?? "";
  return RECOVERABLE_RUNTIME_PATTERNS.some((pattern) => pattern.test(message));
}

function buildRecoveryUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("__kora_runtime_refresh", Date.now().toString());
  return url.toString();
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  componentDidMount() {
    this.finalizeRecoveryState();
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (prevState.hasError !== this.state.hasError || prevState.error !== this.state.error) {
      this.finalizeRecoveryState();
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  finalizeRecoveryState() {
    if (typeof window === "undefined") {
      return;
    }

    if (this.state.hasError) {
      return;
    }

    sessionStorage.removeItem(RUNTIME_RECOVERY_KEY);

    const url = new URL(window.location.href);
    if (url.searchParams.has("__kora_runtime_refresh")) {
      url.searchParams.delete("__kora_runtime_refresh");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);

    if (typeof window === "undefined") {
      return;
    }

    if (!isRecoverableRuntimeError(error)) {
      sessionStorage.removeItem(RUNTIME_RECOVERY_KEY);
      return;
    }

    const alreadyAttemptedRecovery = sessionStorage.getItem(RUNTIME_RECOVERY_KEY) === "1";
    if (alreadyAttemptedRecovery) {
      return;
    }

    sessionStorage.setItem(RUNTIME_RECOVERY_KEY, "1");
    window.location.replace(buildRecoveryUrl());
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="max-w-md p-6 bg-slate-800 rounded-lg border border-slate-700">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-300 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
