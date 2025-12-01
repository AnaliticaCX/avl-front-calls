import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
                {items.map((item, index) => (
                    <li key={item.href} className="flex items-center">
                        {index > 0 && (
                            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                        {index === items.length - 1 ? (
                            <span className="font-medium text-gray-900">
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="text-gray-500 hover:text-primary transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
