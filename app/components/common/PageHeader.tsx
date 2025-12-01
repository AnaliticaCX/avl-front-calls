interface PageHeaderProps {
    title: string;
    description: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {title}
            </h1>
            <p className="text-lg text-gray-500 max-w-3xl">
                {description}
            </p>
        </div>
    );
}
