interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    message: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
    return (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
            {icon ? (
                <div className="mb-4 text-gray-400">
                    {icon}
                </div>
            ) : (
                <svg
                    className="w-16 h-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500">{message}</p>
        </div>
    );
}
