import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Home } from './pages/Home';
import { DatabaseView } from './pages/DatabaseView';
import { TableView } from './pages/TableView';
import { RecordDetail } from './pages/RecordDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/database" element={<DatabaseView />} />
            <Route path="/database/:table" element={<TableView />} />
            <Route path="/database/:table/:id" element={<RecordDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;