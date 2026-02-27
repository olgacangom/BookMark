import { render } from '@testing-library/react';
import App from './App';
import { describe, it } from 'vitest';

describe('App Component', () => {
  it('renders correctly', () => {
    render(<App />);
  });
});