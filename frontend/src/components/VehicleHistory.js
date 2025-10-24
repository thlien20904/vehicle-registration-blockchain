import React, { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VehicleHistory = () => {
  const [license, setLicense] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!license.trim()) return;
    setLoading(true);
    setHistory([]);
    setError('');

    try {
      const res = await axios.get(`${API_URL}/vehicles/${license}/history`);
      const formatted = res.data.map(h => ({
        TxId: h.TxId,
        Timestamp: h.Timestamp
          ? dayjs(h.Timestamp.seconds * 1000).format('YYYY-MM-DD HH:mm:ss')
          : 'N/A',
        Status: h.Record?.status || 'N/A',
        Owner: h.Record?.owner || 'N/A'
      }));
      setHistory(formatted);
    } catch (err) {
      console.error('❌ Lỗi lấy lịch sử:', err);
      setError('Không thể lấy lịch sử. Hãy kiểm tra lại biển số xe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3 shadow-sm">
      <div className="card-header bg-info text-white fw-bold">🕒 Lịch sử xe</div>
      <div className="card-body">
        <div className="mb-3 d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Nhập biển số xe"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />
          <button className="btn btn-primary" onClick={fetchHistory}>
            Xem lịch sử
          </button>
        </div>

        {loading && <p>⏳ Đang tải...</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && history.length === 0 && (
          <p>Không có dữ liệu lịch sử.</p>
        )}

        {!loading && history.length > 0 && (
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Transaction ID</th>
                <th>Trạng thái</th>
                <th>Chủ sở hữu</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, idx) => (
                <tr key={idx}>
                  <td>{h.Timestamp}</td>
                  <td style={{ wordBreak: 'break-all' }}>{h.TxId}</td>
                  <td>{h.Status}</td>
                  <td>{h.Owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VehicleHistory;
