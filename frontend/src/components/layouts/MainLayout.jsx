import { Outlet } from 'react-router-dom';

/**
 * MainLayout component that provides a consistent layout wrapper for authenticated routes
 * The Outlet component renders the child route's element
 */
const MainLayout = () => {
  return (
    <div className="main-layout">
      {/* You can add authenticated user header/sidebar/navigation here */}
      <div className="main-content">
        <Outlet /> {/* This renders the child route component */}
      </div>
      {/* You can add authenticated user footer here if needed */}
    </div>
  );
};

export default MainLayout;