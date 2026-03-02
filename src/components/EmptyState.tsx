import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import './EmptyState.css';
import './EmptyState.css';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon ?? <FileQuestion size={48} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {(actionLabel && (actionTo || onAction)) && (
        actionTo ? (
          <Link to={actionTo} className="btn btn-primary empty-state-cta">{actionLabel}</Link>
        ) : (
          <button type="button" className="btn btn-primary empty-state-cta" onClick={onAction}>{actionLabel}</button>
        )
      )}
    </div>
  );
}
