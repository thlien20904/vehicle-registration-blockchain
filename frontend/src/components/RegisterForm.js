import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    owner: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ Chặn reload mặc định
    console.log("🚀 Gửi form:", formData); // ✅ Log kiểm tra
    if (!formData.make || !formData.model || !formData.licensePlate || !formData.owner) {
      setMessage('❌ Lỗi: Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/register`, formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log("✅ Server trả về:", res.data);
      setMessage('✅ Xe đăng ký thành công!');
      onRegister(); // Cập nhật danh sách
      setFormData({ make: '', model: '', licensePlate: '', owner: '' });
    } catch (error) {
      console.error('❌ Lỗi đăng ký:', error);
      setMessage('❌ Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="card">
      <div className="card-header">Đăng ký xe mới</div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Hãng xe (make):</label>
            <input
              type="text"
              className="form-control"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Model:</label>
            <input
              type="text"
              className="form-control"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Biển số (licensePlate):</label>
            <input
              type="text"
              className="form-control"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Chủ xe (owner):</label>
            <input
              type="text"
              className="form-control"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">Đăng ký</button>
        </form>

        {message && <div className="alert alert-info mt-3">{message}</div>}
      </div>
    </div>
  );
};

export default RegisterForm;
