import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import React from 'react';
import './App.css';
import { useAuth } from './components/auth/AuthContext.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import PageNotFound from './components/common/PageNotFound.jsx';
import NavBar from './components/common/navbar/NavBar.jsx';
import Footer from './components/common/Footer.jsx';
import MainLayout from './components/layouts/MainLayout.jsx';
//Import public pages
import LandingPage from './pages/publicpages/LandingPage.jsx';
import About from './pages/publicpages/About.jsx';
import ContactUs from './pages/publicpages/ContactUs.jsx';
import ResearcherList from './pages/publicpages/ResearcherList.jsx';
import ProfilePage from './pages/publicpages/ProfilePage.jsx';
import LoginPage from './pages/auth/loginpage/LoginPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import VerifyEmail from './pages/auth/VerifyEmail.jsx';
import Unauthorized from './pages/publicpages/Unauthorized.jsx';
// Import quiz pages
import QuizList from './pages/publicpages/QuizList.jsx';
import QuizPage from './pages/publicpages/quizpage/QuizPage.jsx';
import QuizResults from './pages/publicpages/QuizResults.jsx';
import Demographics from './pages/publicpages/Demographics.jsx';
// Private pages
import CreateQuiz from './pages/privatepages/CreateQuiz.jsx';
import ResearcherDashboard from './pages/privatepages/ResearcherDashboard.jsx';
import ResearcherQuizList from './pages/privatepages/ResearcherQuizList.jsx';
import QuizDetail from './pages/privatepages/QuizDetail';
// Import Admin only pages
import AdminDashboard from './pages/privatepages/AdminDashboard.jsx';


function App(){
    const [theme, setTheme] = useState('light');
    const { user } = useAuth();


    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
        }, [theme]);

    const getNavItems = (user = {}) => {
        const isAdmin = user.role === 'admin';
        const isResearcher = user.role === 'researcher';
        const isRegularUser = !isAdmin && !isResearcher;

        const items = [];

        // Shared between researchers and regular users
        if (isRegularUser || isResearcher) {
            items.push(
                { label: 'Quizzes', path: '/quizzes' },
                { label: 'Researcher Accounts', path: '/accounts' }
            );
        }

        // Register only for regular users
        if (isRegularUser) {
            items.push({ label: 'Register', path: '/register' });
        }

        // Always visible
        items.push(
            { label: 'About', path: '/about' },
            { label: 'Contact', path: '/contact' }
        );

        // Role-specific items
        if (isAdmin) {
            items.push(
                { label: 'Dashboard', path: '/admin/dashboard' },
                { label: 'Profile', path: '/profile' }
            );
        } else if (isResearcher) {
            items.push(
                { label: 'Dashboard', path: '/researcher/dashboard' },
                { label: 'Profile', path: '/profile' }
            );
        }

        return items;
    };

    const navItems = getNavItems(user || {});

    return(
        <>
            <NavBar 
                title={'Ailuminate'}
                items={navItems}
                theme={theme}
                setTheme={setTheme}
            />
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path='/login' element={<LoginPage />} />
                <Route path='/register' element={<SignupPage />} />
                <Route path='/about' element={<About />} />
                <Route path='/verify-email/:token' element={<VerifyEmail />} />
                <Route path='/forgot-password' element={<ForgotPassword />} />
                <Route path='/reset-password/:token' element={<ResetPassword />} />
                <Route path='/contact' element={<ContactUs />} />
                <Route path='/unauthorized' element={<Unauthorized />} />
                <Route path='/accounts' element={<ResearcherList />} />
                <Route path='/profile' element={<ProfilePage />} />
                <Route path='/profile/:id' element={<ProfilePage />} />

                {/* Catch-all route for 404 */}
                {/* Quizzes */}
                <Route path='/quizzes' element={<QuizList />} />
                <Route path="/quizzes/:quizId/sessions/:sessionId/question/:questionId" element={<QuizPage />} />
                <Route path='/quizzes/:id' element={<QuizPage />} />
                <Route path='/quizzes/:id/demographics' element={<Demographics />} />
                <Route path='/quizzes/:id/results' element={<QuizResults />} />

                {/* Protected routes for researchers */}
                <Route element={<ProtectedRoute allowedRoles={['researcher', 'admin']}><MainLayout/></ProtectedRoute>}>
                    <Route path='/researcher/dashboard' element={<ResearcherDashboard />} />
                    <Route path='/researcher/quizzes' element={<ResearcherQuizList />} />
                    <Route path='/researcher/quizzes/:id' element={<QuizDetail />} />
                    <Route path='/researcher/quizzes/create' element={<CreateQuiz />} />
                    <Route path='/researcher/quizzes/:quizId/edit' element={<CreateQuiz />} />
                    {/* <Route path='/researcher/quizzes/:id/stats' element={<QuizStats />} /> */}
                </Route>

                {/* Protected routes for admin */}
                <Route element={<ProtectedRoute allowedRoles={['admin']}><MainLayout/></ProtectedRoute>}>
                    <Route path='/admin/dashboard' element={<AdminDashboard />} />
                    {/* <Route path='/admin/quizzes' element={<AdminQuizList />} /> */}
                    {/* <Route path='/admin/quizzes/:id' element={<AdminQuizDetail />} /> */}
                </Route>
                

                {/* Add not found page, and so on! */}
                <Route path='*' element={<PageNotFound />} />
            </Routes>
            <Footer />
        </>
    );
}

export default App;