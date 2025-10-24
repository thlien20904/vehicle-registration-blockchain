import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Dashboard = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get(`${API_URL}/vehicles/count`);
        setCount(res.data.count);
      } catch (err) {
        console.error('❌ Lỗi khi lấy tổng số xe:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="card mt-3 shadow-sm">
      <div className="card-header bg-primary text-white fw-bold">📊 Dashboard</div>
      <div className="card-body text-center">
        {loading ? (
          <p>⏳ Đang tải...</p>
        ) : (
          <>
            <h2 className="text-success">{count}</h2>
            <p>Tổng số xe đã đăng ký trên blockchain</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
