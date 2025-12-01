interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage?: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    perPage,
    onPageChange,
    onPerPageChange
}: PaginationProps) {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                        Mostrando página{" "}
                        <span className="font-medium">{currentPage}</span> de{" "}
                        <span className="font-medium">{totalPages}</span>
                        {" "}({totalItems} resultados totales)
                        {onPerPageChange && perPage && (
                            <select
                                value={perPage}
                                onChange={(e) => onPerPageChange(Number(e.target.value))}
                                className="ml-4 border-gray-300 rounded-md text-sm text-gray-600 focus:ring-primary focus:border-primary"
                            >
                                <option value="10">10 por pág</option>
                                <option value="25">25 por pág</option>
                                <option value="50">50 por pág</option>
                                <option value="100">100 por pág</option>
                            </select>
                        )}
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Anterior</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {getPageNumbers().map((page, idx) => (
                            typeof page === "number" ? (
                                <button
                                    key={idx}
                                    onClick={() => onPageChange(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all ${page === currentPage
                                        ? "z-10 bg-blue-600 border-blue-600 text-white shadow-md"
                                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span
                                    key={idx}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                    {page}
                                </span>
                            )
                        ))}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Siguiente</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
