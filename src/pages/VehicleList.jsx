import { CarFront, Eye, Pencil, Trash2 } from 'lucide-react';

export default function VehicleList({ vehicles, totalCount, onView, onEdit, onDelete }) {
  return (
    <section className="list-section">
      <div className="section-heading list-heading">
        <div>
          <span>Vehicle list</span>
          <h2>All Vehicle Records</h2>
        </div>
        <p>
          Showing {vehicles.length} of {totalCount} records
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vehicle Photo</th>
              <th>Vehicle Number</th>
              <th>Vehicle Description</th>
              <th>Customer Name</th>
              <th>Customer Email</th>
              <th>Customer Phone Number</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <div className="vehicle-thumb">
                    {vehicle.photo ? <img src={vehicle.photo} alt={vehicle.vehicleNumber} /> : <CarFront size={24} />}
                  </div>
                </td>
                <td className="strong-cell">{vehicle.vehicleNumber}</td>
                <td>{vehicle.vehicleDescription}</td>
                <td>{vehicle.customerName}</td>
                <td>{vehicle.customerEmail}</td>
                <td>{vehicle.customerPhone}</td>
                <td>{vehicle.dateAdded}</td>
                <td>
                  <div className="action-group">
                    <button title="View vehicle details" onClick={() => onView(vehicle)}>
                      <Eye size={17} />
                    </button>
                    <button title="Edit vehicle" onClick={() => onEdit(vehicle)}>
                      <Pencil size={17} />
                    </button>
                    <button className="danger" title="Delete vehicle" onClick={() => onDelete(vehicle)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td className="empty-state" colSpan="8">
                  No vehicle records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
