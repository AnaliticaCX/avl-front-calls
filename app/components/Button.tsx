interface ButtonProps {
    text: string;
    onClick?: () => void;
    submit?: boolean;
    variant?: "primary" | "secondary";
    fullWidth?: boolean;
    disabled?: boolean;
}

export default function Button({
    text,
    onClick,
    submit = false,
    variant = "primary",
    fullWidth = false,
    disabled = false
}: ButtonProps) {
    const variantClasses = {
        primary: "btn-primary",
        secondary: "btn-secondary"
    };

    const classes = [
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-60 pointer-events-none' : 'cursor-pointer'
    ].filter(Boolean).join(' ');

    return (
        <button
            type={submit ? 'submit' : 'button'}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            aria-disabled={disabled}
            className={classes}
        >
            {text}
        </button>
    );
}
