import { Link } from 'react-router-dom';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  /** registration | order */
  variant: 'registration' | 'order';
};

export function ConsentField({ checked, onChange, id, variant }: Props) {
  const label =
    variant === 'registration' ? (
      <>
        Я даю согласие на обработку персональных данных для регистрации личного кабинета и
        оформления заявок в соответствии с{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer">
          политикой обработки персональных данных
        </Link>
        .
      </>
    ) : (
      <>
        Я согласен(на) с{' '}
        <Link to="/terms" target="_blank" rel="noopener noreferrer">
          условиями оформления заявки
        </Link>{' '}
        и{' '}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer">
          политикой обработки персональных данных
        </Link>
        .
      </>
    );

  return (
    <label className="consent-field" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
      />
      <span className="consent-field__text">{label}</span>
    </label>
  );
}
