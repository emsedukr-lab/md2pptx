import { cn } from "../utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("animate-fade-in px-6 py-6", className)}>
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}
