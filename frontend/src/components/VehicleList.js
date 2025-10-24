import React from 'react';

const VehicleList = ({ vehicles, searchTerm, setSearchTerm }) => {
  const filteredVehicles = vehicles.filter((v) =>
    v.Key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card mt-3 shadow-sm">
      <div className="card-header bg-dark text-white fw-bold">
        🚗 Danh sách xe (Blockchain Ledger)
      </div>

      <div className="card-body">
        {/* 🔍 Ô tìm kiếm */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Tìm theo biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredVehicles.length === 0 ? (
          <p>Không tìm thấy xe nào.</p>
        ) : (
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Biển số</th>
                <th>Hãng xe</th>
                <th>Model</th>
                <th>Màu sắc</th>
                <th>Chủ xe</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((item, index) => {
                const r = item.Record || {};
                return (
                  <tr key={index}>
                    <td>{item.Key}</td>
                    <td>{r.make}</td>
                    <td>{r.model}</td>
                    <td>{r.color}</td>
                    <td>{r.owner}</td>
                    <td>{r.registrationDate}</td>
                    <td>{r.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default VehicleList;
