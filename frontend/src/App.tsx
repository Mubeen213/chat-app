import React from 'react';
import { ChatProvider } from './contexts/ChatContext';
import Layout from './components/layout/Layout';
import ChatContainer from './components/chat/ChatContainer';

/**
 * Main application component
 */
const App: React.FC = () => {
  return (
    <ChatProvider>
      <Layout>
        <ChatContainer />
      </Layout>
    </ChatProvider>
  );
};

export default App;
