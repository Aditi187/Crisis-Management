import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './components/Login';

// White box test for Login component rendering and internal state
describe('White Box Testing: Login Component', () => {
  it('renders login form properly', () => {
    // We mock the navigation/router purely to test internal rendering
    render(
      <BrowserRouter>
        <Login onLogin={jest.fn()} />
      </BrowserRouter>
    );
    
    // Check if internal fields render successfully
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passInput = screen.getByPlaceholderText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    expect(usernameInput).toBeInTheDocument();
    expect(passInput).toBeInTheDocument();
    expect(submitBtn).toBeInTheDocument();
  });

  it('updates state internally when typing', () => {
    render(
      <BrowserRouter>
        <Login onLogin={jest.fn()} />
      </BrowserRouter>
    );

    const usernameInput = screen.getByPlaceholderText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    expect(usernameInput.value).toBe('admin');
  });
});
