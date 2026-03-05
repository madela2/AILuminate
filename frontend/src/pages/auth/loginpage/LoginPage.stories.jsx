/**
 * LoginPage component stories
 * 
 * The LoginPage component handles user authentication and provides
 * feedback on login attempts.
 */

import React from 'react';
import LoginPage from './LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../components/auth/AuthContext';
import { within, userEvent, waitFor } from '@storybook/testing-library';

const MockAuthProvider = ({ children }) => {
  const login = async () => {
    const error = new Error();
    error.response = { data: { message: 'Invalid username or password' } };
    throw error;
  };

  const logout = () => {};

  return (
    <AuthContext.Provider value={{ login, logout, user: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export default {
  title: 'Pages/LoginPage',
  component: LoginPage,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <MockAuthProvider>
          <Story />
        </MockAuthProvider>
      </BrowserRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
# LoginPage Component

The LoginPage component provides authentication functionality for Ailuminate users.

## Features
- Username and password validation
- Error handling for failed login attempts
- "Forgot password" functionality
- Navigation to registration page
- Visual feedback during authentication process

## Implementation Notes
- Uses the AuthContext for authentication state management
- Integrates with the backend API for user verification
- Redirects users based on their role after successful login
        `
      }
    }
  }
};

export const Default = () => <LoginPage />;
Default.parameters = {
  docs: {
    description: {
      story: 'Default state of the login form, ready for user input.'
    }
  }
};

export const LoginFails = () => <LoginPage />;
LoginFails.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // 🧪 simulate user typing into inputs
  await userEvent.type(canvas.getByPlaceholderText('Username'), 'wronguser');
  await userEvent.type(canvas.getByPlaceholderText('Password'), 'wrongpass');

  // 🧪 click login button
  await userEvent.click(canvas.getByRole('button', { name: /login/i }));

  // ⏳ wait for error to show
  await waitFor(() => {
    const error = canvas.getByText(/invalid username or password/i);
    if (!error) throw new Error("Error message not found");
  });
};
LoginFails.parameters = {
  docs: {
    description: {
      story: 'This simulation shows what happens when a user enters incorrect credentials. An error message appears after the login attempt fails.'
    }
  }
};

export const LoginSucceeds = () => <LoginPage />;
LoginSucceeds.parameters = {
  docs: {
    description: {
      story: 'This simulation demonstrates a successful login flow. After entering valid credentials, the user would be redirected to their dashboard based on their role.'
    }
  }
};
