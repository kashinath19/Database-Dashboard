import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-blue-600">Resume Database Viewer</h1>
      </header>
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Resume Database Viewer</h2>
            <p className="text-gray-600">
              The application is starting up. Basic structure is working!
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Users</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Contacts</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Resumes</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;