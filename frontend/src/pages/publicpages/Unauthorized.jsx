import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <div style={{ marginTop: '30px' }}>
        <Link to="/" style={{ marginRight: '20px' }}>Back to Home</Link>
      </div>
    </div>
  );
};

export default Unauthorized;