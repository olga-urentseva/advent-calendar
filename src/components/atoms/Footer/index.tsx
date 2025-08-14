import './styles.css'
import { Snow } from './Snow'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <>
    <Snow />
    <footer className="footer">
      
      <div className="footer__content">
        <p className="footer__copyright">
          © {currentYear} Magic Advent Calendar. All rights reserved.
        </p>
      </div>
    </footer>
    </>
    
  )
}
