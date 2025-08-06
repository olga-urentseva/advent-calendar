interface HomeViewProps {
  onCreateCalendar: () => void
  onOpenCalendar: () => void
}

export const HomeView: React.FC<HomeViewProps> = ({ onCreateCalendar, onOpenCalendar }) => {
  return (
    <div className="container">
      <h1 className="title">🎄 Advent Calendar</h1>
      <p className="subtitle">
        Create a personalized advent calendar for your loved ones or open one you received
      </p>
      
      <div className="button-group">
        <button 
          className="btn btn-primary"
          onClick={onCreateCalendar}
        >
          ✨ Create an Advent Calendar
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={onOpenCalendar}
        >
          📦 I Received an Advent Calendar
        </button>
      </div>
    </div>
  )
} 