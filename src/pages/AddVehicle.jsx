import VehicleForm from '../components/VehicleForm.jsx';

export default function AddVehicle({ vehicle, onSave, onCancel }) {
  return (
    <section className="form-section">
      <div className="section-heading">
        <span>{vehicle ? 'Edit vehicle' : 'Add vehicle'}</span>
        <h2>{vehicle ? 'Update Vehicle Record' : 'Create Vehicle Record'}</h2>
      </div>
      <VehicleForm vehicle={vehicle} onSave={onSave} onCancel={onCancel} />
    </section>
  );
}
