interface ResultsHeaderProps {
    title?: string;
    currentCount: number;
    totalCount: number;
    itemName: string;
    itemNamePlural?: string;
    onDownload?: () => void;
    downloadButtonText?: string;
}

export default function ResultsHeader({
    title = "Resultados",
    currentCount,
    totalCount,
    itemName,
    itemNamePlural,
    onDownload,
    downloadButtonText = "Descargar Resultados"
}: ResultsHeaderProps) {
    const pluralName = itemNamePlural || `${itemName}s`;
    const displayName = totalCount !== 1 ? pluralName : itemName;
    const foundText = totalCount !== 1 ? "encontrados" : "encontrado";

    return (
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {title}
                </h2>
                <p className="text-sm text-gray-500">
                    Mostrando <span className="font-medium text-gray-900">{currentCount}</span> de <span className="font-medium text-gray-900">{totalCount}</span> {displayName} {foundText}
                </p>
            </div>
            {onDownload && (
                <button
                    onClick={onDownload}
                    className="btn-secondary"
                >
                    {downloadButtonText}
                </button>
            )}
        </div>
    );
}
