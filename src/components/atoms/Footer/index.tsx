import './styles.css'
import { Snow } from './Snow'
import { Snowman } from './Snowman'
import { Tree } from './Tree'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <>
    <Snow />
    <footer className="footer">
      <Snowman />
      <Tree />
      <div className="footer__content">
        <p className="footer__copyright">
          © {currentYear} Magic Advent Calendar. All rights reserved.
        </p>
      </div>
    </footer>
    </>
    
  )
}
