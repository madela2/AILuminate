import React, { useState } from 'react';
import ThemeToggle from './themeToggle';

/**
 * ThemeToggle component allows users to switch between light and dark themes
 * throughout the application. It displays a sun icon in dark mode and a moon
 * icon in light mode.
 */
export default {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The ThemeToggle component is a simple button that toggles between light and dark themes.
It uses React Icons (HiSun and HiMoon) to display appropriate icons based on the current theme.

## Usage
\`\`\`jsx
import ThemeToggle from './components/common/themeToggle';

function App() {
  const [theme, setTheme] = useState('light');
  
  return (
    <div className={theme}>
      <ThemeToggle theme={theme} setTheme={setTheme} />
    </div>
  );
}
\`\`\`
        `
      }
    }
  },
  argTypes: {
    theme: {
      description: 'Current theme setting',
      control: 'select',
      options: ['light', 'dark'],
      defaultValue: 'light',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'light' }
      }
    },
    setTheme: {
      description: 'Function to update the theme',
      table: {
        type: { summary: 'function' }
      }
    }
  }
};

// Interactive story with working toggle
export const Interactive = () => {
  const [theme, setTheme] = useState('light');
  return (
    <div style={{ padding: '20px', background: theme === 'dark' ? '#333' : '#fff' }}>
      <p style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
        Current theme: {theme}
      </p>
      <ThemeToggle theme={theme} setTheme={setTheme} />
    </div>
  );
};
Interactive.parameters = {
  docs: {
    description: {
      story: 'A fully interactive example of the ThemeToggle component. Click the button to toggle between light and dark themes.'
    }
  }
};

// Light theme state
export const LightTheme = () => <ThemeToggle theme="light" setTheme={() => {}} />;
LightTheme.parameters = {
  docs: {
    description: {
      story: 'The ThemeToggle component in light theme state, displaying the moon icon.'
    }
  }
};

// Dark theme state
export const DarkTheme = () => <ThemeToggle theme="dark" setTheme={() => {}} />;
DarkTheme.parameters = {
  docs: {
    description: {
      story: 'The ThemeToggle component in dark theme state, displaying the sun icon.'
    }
  }
};