import { FiChevronLeft } from 'react-icons/fi'

interface NavBarProps {
  onBack: () => void
  title?: string
  backLabel?: string
  disabled?: boolean
}

export default function NavBar({ onBack, title, backLabel = '뒤로', disabled }: NavBarProps): React.JSX.Element {
  return (
    <nav className="nav-bar">
      <button className="nav-back" onClick={onBack} disabled={disabled} aria-label={backLabel}>
        <FiChevronLeft />
        {backLabel}
      </button>
      {title && <div className="nav-title">{title}</div>}
    </nav>
  )
}
