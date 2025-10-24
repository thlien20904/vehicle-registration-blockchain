import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import RegisterForm from './components/RegisterForm';
import VehicleList from './components/VehicleList';
import Dashboard from './components/Dashboard';
import VehicleHistory from './components/VehicleHistory';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/vehicles`);
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => fetchVehicles();

  return (
    <div className="container mt-4 app-container">
      <h1 className="text-center text-primary fw-bold mb-4">
        🚗 Hệ thống Đăng ký Phương tiện (Blockchain)
      </h1>

      {/* Navbar */}
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Đăng ký xe</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'vehicles' ? 'active' : ''}`} onClick={() => setActiveTab('vehicles')}>Danh sách xe</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Lịch sử xe</button>
        </li>
      </ul>

      {/* Tab content */}
      <div className="mt-3">
        {loading ? (
          <p>⏳ Đang tải dữ liệu...</p>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'register' && <RegisterForm onRegister={handleRegister} />}
            {activeTab === 'vehicles' && <VehicleList vehicles={vehicles} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
            {activeTab === 'history' && <VehicleHistory />}
          </>
        )}
      </div>

      <footer className="text-center mt-5 text-muted">
        <hr />
        <small>© {new Date().getFullYear()} Vehicle Registration System — Hyperledger Fabric Demo</small>
      </footer>
    </div>
  );
}

export default App;
