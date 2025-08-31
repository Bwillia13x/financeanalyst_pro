import React from 'react';

const Landing = () => {
  console.log('Landing page rendering');

  return (
    <div>
      <h1>Finance Analyst Pro</h1>
      <p>Welcome to the landing page</p>
      <nav>
        <a href="/private-analysis">Go to Private Analysis</a>
      </nav>
    </div>
  );
};

export default Landing;
