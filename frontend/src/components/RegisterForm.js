import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const RegisterForm = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    licensePlate: '',
    owner: '',
    color: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // ✅ Hàm xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Xóa lỗi khi người dùng nhập lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ Kiểm tra hợp lệ dữ liệu
  const validateForm = () => {
    const newErrors = {};
    const licenseRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/; // ví dụ: 29A-12345

    if (!formData.make.trim()) newErrors.make = 'Vui lòng nhập hãng xe.';
    if (!formData.model.trim()) newErrors.model = 'Vui lòng nhập model.';
    if (!formData.color.trim()) newErrors.color = 'Vui lòng nhập màu xe.';
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Vui lòng nhập biển số xe.';
    } else if (!licenseRegex.test(formData.licensePlate)) {
      newErrors.licensePlate = 'Biển số không hợp lệ. Định dạng đúng: 29A-12345';
    }
    if (!formData.owner.trim()) newErrors.owner = 'Vui lòng nhập tên chủ xe.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Gửi form đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    try {
      const res = await axios.post(`${API_URL}/register`, formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Server trả về:', res.data);

      setMessage('✅ Xe đăng ký thành công!');
      onRegister && onRegister(); // cập nhật danh sách nếu có
      setFormData({ make: '', model: '', licensePlate: '', owner: '', color: '' });
      setErrors({});
    } catch (error) {
      console.error('❌ Lỗi đăng ký:', error);
      setMessage('❌ ' + (error.response?.data?.error || 'Không thể kết nối server.'));
    }
  };

  return (
    <div className="card shadow-sm mt-3">
      <div className="card-header bg-primary text-white fw-bold">
        🚗 Đăng ký xe mới
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {['make', 'model', 'color', 'licensePlate', 'owner'].map((field) => (
            <div key={field} className="mb-3">
              <label className="form-label">
                {{
                  make: 'Hãng xe (make)',
                  model: 'Model',
                  color: 'Màu xe (color)',
                  licensePlate: 'Biển số (licensePlate)',
                  owner: 'Chủ xe (owner)',
                }[field]}:
              </label>
              <input
                type="text"
                className={`form-control ${errors[field] ? 'is-invalid' : ''}`}
                name={field}
                value={formData[field]}
                onChange={handleChange}
              />
              {errors[field] && (
                <div className="invalid-feedback">{errors[field]}</div>
              )}
            </div>
          ))}

          <button type="submit" className="btn btn-success w-100">
            📝 Đăng ký xe
          </button>
        </form>

        {message && (
          <div
            className={`alert mt-3 ${
              message.startsWith('✅') ? 'alert-success' : 'alert-danger'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
