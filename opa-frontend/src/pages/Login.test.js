import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { DarkModeProvider } from '../context/DarkModeContext';
import Login from './Login';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  BrowserRouter: ({ children }) => <div>{children}</div>,
}));

test('renders Login page properly', () => {
  render(
    <AuthProvider>
      <DarkModeProvider>
        <Login />
      </DarkModeProvider>
    </AuthProvider>
  );
  
  const welcomeText = screen.getByText(/Sign in to your account/i);
  expect(welcomeText).toBeInTheDocument();
  
  const loginButton = screen.getByRole('button', { name: /Sign in/i });
  expect(loginButton).toBeInTheDocument();
});
