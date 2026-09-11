import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 2400 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <div className="toast" role="status">
      <CheckCircle2 size={16} color="var(--status-restday)" />
      {message}
    </div>
  );
}
