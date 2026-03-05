import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../components/auth/AuthContext';
import styles from './styles/NavBar.module.css';
import ThemeToggle from '../themetoggle/themeToggle';

const NavBar = ({ theme, setTheme, items }) =>{
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = items || [];

    // Hide the navbar on quiz pages
    const hideNavBar = 
    location.pathname.startsWith('/quizzes/') ||
    location.pathname === '/*';

    const handleLogout = async () =>{
        await logout();
        navigate('/login');
    };

    const getGreeting = () =>{
        const hour = new Date().getHours();
        if(hour < 12) return 'Morning';
        if(hour < 18) return 'Afternoon';
        if(hour < 21) return 'Evening';
        return 'Night,';
    };

       if(hideNavBar) return null;

    return(
        <nav className={styles['navbar']}>
            <Link to='/'>
                <img 
                    className={styles['logo']} 
                    src="/Ailuminate_logo.png" 
                    alt="The Ailuminate Logo that redirects to the about page when clicked" 
                />
            </Link>

            {Array.isArray(navItems) && navItems.length > 0 && (
                <div>
                    {navItems.map((item, index) =>(
                        <React.Fragment key={index}>
                            {item.path ? (
                                <Link to={item.path}>
                                    <button className={styles['navBtn']}>
                                        {item.label}
                                    </button>
                                </Link>
                            ) : (
                                <button
                                    className={styles['navBtn']}
                                    onClick={item.action}
                                >
                                    {item.label}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {user ? (
                <>
                    <button 
                        className={styles['navBtn']}
                        onClick={handleLogout}
                    >
                            Logout
                    </button>
                    <span className={styles['greeting']}>{getGreeting()}, {user.username}!</span>
                </>
            ) : (
                <button 
                    className={styles['navBtn']}
                    onClick={() => navigate('/login')}
                >
                    Login
                </button>
            )}

            <ThemeToggle theme={theme} setTheme={setTheme} />
        </nav>
    );
};

export default NavBar;
