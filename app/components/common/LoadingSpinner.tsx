interface LoadingSpinnerProps {
    text?: string;
}

export default function LoadingSpinner({ text = "Cargando..." }: LoadingSpinnerProps) {
    return (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-hairline border-t-accent-500"></div>
            <p className="mt-4 text-ink-500 font-medium">{text}</p>
        </div>
    );
}
