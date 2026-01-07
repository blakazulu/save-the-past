interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-sand border-t-terracotta rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
