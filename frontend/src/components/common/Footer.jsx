import { Link, useLocation } from 'react-router-dom';
import styles from './styles/Footer.module.css';
import { MdOutlineContactSupport } from "react-icons/md";
import { HiOutlineMapPin } from "react-icons/hi2";

const Footer = ({ theme }) =>{
    const location = useLocation();

    const hideFooter = location.pathname === '/*';

    if(hideFooter) return null;

    return(
        <footer className={styles['footer']}>
            <img className={styles['footer-logo']} src="/Ailuminate_transparent.png" alt="The Ailuminate Logo in the footer of the page" />
            <div>
                <h3><MdOutlineContactSupport /> For more info: <Link to='/about'>About Ailuminate</Link></h3>
                <h3><MdOutlineContactSupport /> For support: <Link to='/contact'>Contact us</Link></h3>
            </div>
            <div>
                <h3><HiOutlineMapPin /> Where to find us:</h3>
                    <address>
                        NTNU - Norwegian University of Science and Technology<br/>
                        Teknologiveien 22<br/>
                        2815 Gjøvik, Norway
                    </address>
            </div>
        </footer>
    );
};

export default Footer;