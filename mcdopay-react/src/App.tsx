import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
    </AppDataProvider>
  );
}

export default App;
