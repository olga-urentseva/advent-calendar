import './styles.css'

export function Snowman() {
  return (
    <div className="snowman">
      <div className="snowman__head"></div>
      <div className="snowman__body"></div>
      <div className="snowman__eyes">
        <div className="snowman__eye snowman__eye--left"></div>
        <div className="snowman__eye snowman__eye--right"></div>
      </div>
      <div className="snowman__nose"></div>
      <div className="snowman__smile"></div>
      <div className="snowman__buttons">
        <div className="snowman__button"></div>
        <div className="snowman__button"></div>
        <div className="snowman__button"></div>
      </div>
    </div>
  )
}
