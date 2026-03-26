"use client";

import { Component, type ReactNode } from "react";
import { useTranslations } from "next-intl";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const t = useTranslations("errors");

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">{t("somethingWentWrong")}</h2>
      <p className="mt-2 text-gray-600">
        {error?.message || t("unexpectedError")}
      </p>
      <button
        onClick={onReset}
        className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
