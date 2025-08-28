import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import userReducer, { login, logout } from '../slices/userSlice';

describe('userSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userReducer
      }
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().user;
      expect(state).toEqual({
        name: 'Guest',
        isAuthenticated: false
      });
    });
  });

  describe('login action', () => {
    it('should handle login with valid user data', () => {
      const userData = { name: 'John Doe' };

      store.dispatch(login(userData));

      const state = store.getState().user;
      expect(state.name).toBe('John Doe');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login with empty name', () => {
      const userData = { name: '' };

      store.dispatch(login(userData));

      const state = store.getState().user;
      expect(state.name).toBe('');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login with null name', () => {
      const userData = { name: null };

      store.dispatch(login(userData));

      const state = store.getState().user;
      expect(state.name).toBe(null);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login with undefined name', () => {
      const userData = {};

      store.dispatch(login(userData));

      const state = store.getState().user;
      expect(state.name).toBeUndefined();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle multiple logins', () => {
      // First login
      store.dispatch(login({ name: 'John Doe' }));

      let state = store.getState().user;
      expect(state.name).toBe('John Doe');
      expect(state.isAuthenticated).toBe(true);

      // Second login with different user
      store.dispatch(login({ name: 'Jane Smith' }));

      state = store.getState().user;
      expect(state.name).toBe('Jane Smith');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login with special characters in name', () => {
      const userData = { name: "John-Paul O'Connor" };

      store.dispatch(login(userData));

      const state = store.getState().user;
      expect(state.name).toBe("John-Paul O'Connor");
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle login with very long name', () => {
      const longName = 'A'.repeat(1000);
      const userData = { name: longName };

      store.dispatch(login(userData));

      const state = store.getState().user;
      expect(state.name).toBe(longName);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout action', () => {
    beforeEach(() => {
      // Start with a logged-in user for logout tests
      store.dispatch(login({ name: 'John Doe' }));
    });

    it('should handle logout and reset to initial state', () => {
      store.dispatch(logout());

      const state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout when already logged out', () => {
      store.dispatch(logout()); // First logout

      let state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);

      store.dispatch(logout()); // Second logout

      state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout after multiple logins', () => {
      // Multiple logins
      store.dispatch(login({ name: 'Jane Smith' }));
      store.dispatch(login({ name: 'Bob Wilson' }));

      // Logout should reset to initial state
      store.dispatch(logout());

      const state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should handle complete login-logout cycle', () => {
      // Initial state
      let state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);

      // Login
      store.dispatch(login({ name: 'Test User' }));
      state = store.getState().user;
      expect(state.name).toBe('Test User');
      expect(state.isAuthenticated).toBe(true);

      // Logout
      store.dispatch(logout());
      state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle multiple login-logout cycles', () => {
      // Cycle 1
      store.dispatch(login({ name: 'User 1' }));
      store.dispatch(logout());

      let state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);

      // Cycle 2
      store.dispatch(login({ name: 'User 2' }));
      state = store.getState().user;
      expect(state.name).toBe('User 2');
      expect(state.isAuthenticated).toBe(true);

      store.dispatch(logout());
      state = store.getState().user;
      expect(state.name).toBe('Guest');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('action creators', () => {
    it('should create login action with correct payload', () => {
      const userData = { name: 'Test User' };
      const action = login(userData);

      expect(action).toEqual({
        type: 'user/login',
        payload: userData
      });
    });

    it('should create logout action', () => {
      const action = logout();

      expect(action).toEqual({
        type: 'user/logout'
      });
    });
  });

  describe('reducer immutability', () => {
    it('should not mutate original state object', () => {
      const originalState = store.getState().user;

      store.dispatch(login({ name: 'Test User' }));

      const newState = store.getState().user;

      // States should be different objects
      expect(originalState).not.toBe(newState);
      // But should have different values
      expect(originalState.name).toBe('Guest');
      expect(newState.name).toBe('Test User');
    });

    it('should handle complex state changes without side effects', () => {
      // Perform multiple operations
      store.dispatch(login({ name: 'User 1' }));
      store.dispatch(login({ name: 'User 2' }));
      store.dispatch(logout());

      const finalState = store.getState().user;

      // Should be back to initial state
      expect(finalState).toEqual({
        name: 'Guest',
        isAuthenticated: false
      });
    });
  });

  describe('edge cases', () => {
    it('should handle actions with undefined payload', () => {
      store.dispatch(login(undefined));

      const state = store.getState().user;
      expect(state.name).toBeUndefined();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle actions with null payload', () => {
      store.dispatch(login(null));

      const state = store.getState().user;
      expect(state.name).toBe(null);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle actions with complex objects', () => {
      const complexUserData = {
        name: 'Complex User',
        profile: {
          email: 'user@example.com',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        }
      };

      store.dispatch(login(complexUserData));

      const state = store.getState().user;
      expect(state.name).toBe('Complex User');
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
