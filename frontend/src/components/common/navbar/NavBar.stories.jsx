import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from './NavBar';
import { AuthContext } from '../../../components/auth/AuthContext';

/**
 * The NavBar component provides navigation throughout the application.
 * It adapts to different user roles (no user, researcher, admin) and also
 * incorporates the theme toggle functionality.
 */
export default {
  title: 'Components/NavBar',
  component: NavBar,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
The NavBar component provides the main navigation for the Ailuminate platform.
It displays different navigation options based on the user's authentication status and role.

## Features
- Responsive design
- Role-based navigation links
- Theme toggle integration
- User greeting based on time of day
- Logo with link to homepage

## Usage
\`\`\`jsx
import NavBar from './components/common/NavBar';

function App() {
  const [theme, setTheme] = useState('light');
  
  return (
    <>
      <NavBar 
        theme={theme} 
        setTheme={setTheme}
        items={[
          { label: 'Home', path: '/' },
          { label: 'About', path: '/about' }
        ]} 
      />
      <main>Page content</main>
    </>
  );
}
\`\`\`
        `
      }
    },
    layout: 'fullscreen',
  },
  argTypes: {
    theme: {
      description: 'Current theme setting',
      control: 'select',
      options: ['light', 'dark'],
      defaultValue: 'light'
    },
    setTheme: {
      description: 'Function to update the theme'
    },
    items: {
      description: 'Navigation items to display in the navbar',
      control: 'object',
      table: {
        type: { summary: 'array' },
        defaultValue: { summary: '[]' }
      }
    }
  }
};

// NavBar with no user (logged out)
export const LoggedOut = () => {
  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
      <NavBar theme="light" setTheme={() => {}} items={[
        { label: 'Quizzes', path: '/quizzes' },
        { label: 'About', path: '/about' },
        { label: 'Contact', path: '/contact' }
      ]} />
    </AuthContext.Provider>
  );
};
LoggedOut.parameters = {
  docs: {
    description: {
      story: 'The NavBar as seen by visitors who are not logged in. Shows basic navigation and a login button.'
    }
  }
};

// NavBar with researcher user
export const LoggedInAsResearcher = () => {
  return (
    <AuthContext.Provider 
      value={{ 
        user: { username: 'researcher1', role: 'researcher' }, 
        loading: false 
      }}
    >
      <NavBar theme="light" setTheme={() => {}} items={[
        { label: 'Dashboard', path: '/researcher/dashboard' },
        { label: 'My Quizzes', path: '/researcher/quizzes' },
        { label: 'Create Quiz', path: '/researcher/quizzes/create' }
      ]} />
    </AuthContext.Provider>
  );
};
LoggedInAsResearcher.parameters = {
  docs: {
    description: {
      story: 'The NavBar as seen by authenticated researchers. Shows researcher-specific navigation options and displays the researcher\'s username.'
    }
  }
};

// Add Admin user story for completeness
export const LoggedInAsAdmin = () => {
  return (
    <AuthContext.Provider 
      value={{ 
        user: { username: 'admin', role: 'admin' }, 
        loading: false 
      }}
    >
      <NavBar theme="light" setTheme={() => {}} items={[
        { label: 'Admin Dashboard', path: '/admin/dashboard' },
        { label: 'Manage Users', path: '/admin/users' },
        { label: 'Analytics', path: '/admin/analytics' }
      ]} />
    </AuthContext.Provider>
  );
};
LoggedInAsAdmin.parameters = {
  docs: {
    description: {
      story: 'The NavBar as seen by administrators. Shows admin-specific navigation options and user information.'
    }
  }
};