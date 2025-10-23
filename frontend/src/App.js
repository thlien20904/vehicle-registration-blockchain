import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import RegisterForm from './components/RegisterForm';
import VehicleList from './components/VehicleList';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles`);
      setVehicles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi lấy danh sách xe:', error);
      setLoading(false);
    }
  };

  const handleRegister = () => {
    fetchVehicles();  // Refresh list sau đăng ký
  };

  if (loading) return <div className="container mt-5"><h2>Đang tải...</h2></div>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Hệ thống Đăng ký Phương tiện (Fabric Blockchain)</h1>
      <div className="row">
        <div className="col-md-6">
          <RegisterForm onRegister={handleRegister} />
        </div>
        <div className="col-md-6">
          <VehicleList vehicles={vehicles} />
        </div>
      </div>
    </div>
  );
}

export default App;