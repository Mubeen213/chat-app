import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main application layout component
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
        {children}
      </div>
    </div>
  );
};

export default Layout;
