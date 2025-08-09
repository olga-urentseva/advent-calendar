import './styles.css'

interface TestModeToggleProps {
  testMode: boolean
  onTestModeChange: (testMode: boolean) => void
}

export function TestModeToggle({ testMode, onTestModeChange }: TestModeToggleProps) {
  return (
    <div className="test-mode-toggle">
      <label className="test-toggle">
        <input
          type="checkbox"
          checked={testMode}
          onChange={(e) => onTestModeChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">🧪 Test Mode (Unlock All Days)</span>
      </label>
    </div>
  )
}
