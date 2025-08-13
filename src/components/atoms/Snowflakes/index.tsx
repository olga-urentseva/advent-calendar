import './styles.css'

const SNOWFLAKES_NUMBER = 30

function Snowflakes() {
  return (
    <div className="snowflakes-wrapper">
      {Array.from({ length: SNOWFLAKES_NUMBER }).map((_, index) => (
        <div
          key={index}
          className="snowflake"
          style={{
            '--left': `${Math.random() * 100}%`,
            '--duration': `${Math.random() * 3 + 7}s`,
            '--delay': `${Math.random() * 5}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export default Snowflakes
