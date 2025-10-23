import React from 'react';

const VehicleList = ({ vehicles }) => {
  return (
    <div className="card">
      <div className="card-header">Danh sách xe (On-Chain)</div>
      <div className="card-body">
        {vehicles.length === 0 ? (
          <p>Chưa có xe nào.</p>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Biển số (Key)</th>
                <th>Hãng xe</th>
                <th>Model</th>
                <th>Chủ xe</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((item, index) => {
                const r = item.Record || {};
                return (
                  <tr key={index}>
                    <td>{item.Key || r.LicensePlate || 'N/A'}</td>
                    <td>{r.Brand || r.make || 'N/A'}</td>
                    <td>{r.Model || r.model || 'N/A'}</td>
                    <td>{r.Owner || r.owner || 'N/A'}</td>
                    <td>{r.Status || r.status || 'N/A'}</td>
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
