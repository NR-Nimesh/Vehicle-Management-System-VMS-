import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CarFront, Plus, Search } from 'lucide-react';
import AddVehicle from './pages/AddVehicle.jsx';
import VehicleList from './pages/VehicleList.jsx';
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from './services/api.js';
import './styles.css';

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [query, setQuery] = useState('');
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [viewVehicle, setViewVehicle] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    setVehicles(getVehicles());
  }, []);

  const filteredVehicles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return vehicles;

    return vehicles.filter((vehicle) => {
      return (
        vehicle.vehicleNumber.toLowerCase().includes(value) ||
        vehicle.customerName.toLowerCase().includes(value) ||
        vehicle.dateAdded.includes(value)
      );
    });
  }, [query, vehicles]);

  const handleSave = (payload) => {
    const saved = activeVehicle ? updateVehicle(activeVehicle.id, payload) : createVehicle(payload);
    setVehicles(getVehicles());
    setActiveVehicle(null);
    setIsFormOpen(false);
    setViewVehicle(saved);
  };

  const handleEdit = (vehicle) => {
    setActiveVehicle(vehicle);
    setIsFormOpen(true);
    setViewVehicle(null);
  };

  const handleDelete = (vehicle) => {
    const confirmed = window.confirm(`Delete vehicle ${vehicle.vehicleNumber}?`);
    if (!confirmed) return;

    deleteVehicle(vehicle.id);
    setVehicles(getVehicles());
    setViewVehicle(null);
    if (activeVehicle?.id === vehicle.id) {
      setActiveVehicle(null);
      setIsFormOpen(false);
    }
  };

  const handleAdd = () => {
    setActiveVehicle(null);
    setIsFormOpen(true);
    setViewVehicle(null);
  };

  return (
    <main className="app-shell">
      <section className="top-section">
        <div>
          <div className="eyebrow">
            <CarFront size={18} />
            Fleet registry
          </div>
          <h1>Vehicle Management</h1>
          <p>Register, search, update, and review customer vehicle records from one workspace.</p>
        </div>

        <button className="primary-button" onClick={handleAdd}>
          <Plus size={19} />
          Add Vehicle
        </button>
      </section>

      <section className="toolbar" aria-label="Search vehicles">
        <Search size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by vehicle number, customer name, or date added"
        />
      </section>

      {isFormOpen && (
        <AddVehicle
          vehicle={activeVehicle}
          onSave={handleSave}
          onCancel={() => {
            setActiveVehicle(null);
            setIsFormOpen(false);
          }}
        />
      )}

      {viewVehicle && (
        <section className="details-panel">
          <div className="details-photo">
            {viewVehicle.photo ? <img src={viewVehicle.photo} alt={viewVehicle.vehicleNumber} /> : <CarFront size={54} />}
          </div>
          <div className="details-content">
            <span className="status-pill">Vehicle details</span>
            <h2>{viewVehicle.vehicleNumber}</h2>
            <p>{viewVehicle.vehicleDescription}</p>
            <div className="details-grid">
              <span>Customer</span>
              <strong>{viewVehicle.customerName}</strong>
              <span>Email</span>
              <strong>{viewVehicle.customerEmail}</strong>
              <span>Phone</span>
              <strong>{viewVehicle.customerPhone}</strong>
              <span>Date Added</span>
              <strong>{viewVehicle.dateAdded}</strong>
            </div>
          </div>
        </section>
      )}

      <VehicleList
        vehicles={filteredVehicles}
        totalCount={vehicles.length}
        onView={setViewVehicle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
