import styles from './styles/themeToggle.module.css';
// Importing icons 
import { HiSun } from "react-icons/hi";
import { HiMoon } from "react-icons/hi";

// This code is reused from Emilie's oblig3 in full-stack
const ThemeToggle = ({ theme, setTheme}) =>{
    console.log('Toggling theme from:', theme)
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    
    return(
            <button
                className={styles['toggleBtn']}
                onClick={toggleTheme}
                aria-label='Toggle Theme'
            >
                {theme === 'light' ? <HiMoon className={styles['toggleBtn-moon']} /> : <HiSun className={styles['toggleBtn-sun']}/>}
            </button>
    );
};

export default ThemeToggle;


