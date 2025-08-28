import './styles.css'
import { Link } from 'react-router-dom'
import { Snow } from './Snow'
import { Snowman } from './Snowman'
import { Tree, SmallTree, BigTree } from './Tree'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <>
    <Snow />
    <footer className="footer">
      <Snowman />
      <div className="footer__trees">
        <div className="footer__tree--big">
          <BigTree />
        </div>
        <div className="footer__tree--regular">
          <Tree />
        </div>
        <div className="footer__tree--small">
          <SmallTree />
        </div>
      </div>
      <div className="footer__content">
        <p className="footer__copyright">
          © {currentYear} Magic Advent Calendar. All rights reserved.
        </p>
      </div>
    </footer>
    </>
    
  )
}
