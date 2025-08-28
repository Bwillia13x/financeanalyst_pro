import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { login, logout } from '../store/slices/userSlice';

const UserDisplay = () => {
  const { name, isAuthenticated } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [userName, setUserName] = useState('');

  const handleLogin = e => {
    e.preventDefault();
    if (userName.trim()) {
      dispatch(login({ name: userName }));
      setUserName('');
    }
  };

  return (
    <div>
      <h2>User: {name}</h2>
      {isAuthenticated ? (
        <button onClick={() => dispatch(logout())}>Logout</button>
      ) : (
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Enter your name"
          />
          <button type="submit">Login</button>
        </form>
      )}
    </div>
  );
};

export default UserDisplay;
