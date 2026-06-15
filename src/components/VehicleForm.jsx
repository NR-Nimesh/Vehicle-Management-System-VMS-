import { ImagePlus, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const emptyForm = {
  vehicleNumber: '',
  vehicleDescription: '',
  photo: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  dateAdded: new Date().toISOString().slice(0, 10),
};

export default function VehicleForm({ vehicle, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(vehicle || emptyForm);
  }, [vehicle]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateField('photo', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <label>
        Vehicle Number
        <input
          required
          value={form.vehicleNumber}
          onChange={(event) => updateField('vehicleNumber', event.target.value)}
          placeholder="CAB-4582"
        />
      </label>

      <label className="wide-field">
        Vehicle Description / About Vehicle
        <textarea
          required
          value={form.vehicleDescription}
          onChange={(event) => updateField('vehicleDescription', event.target.value)}
          placeholder="Toyota Prius hybrid, black exterior, recently serviced"
        />
      </label>

      <label>
        Customer Name
        <input
          required
          value={form.customerName}
          onChange={(event) => updateField('customerName', event.target.value)}
          placeholder="A. Perera"
        />
      </label>

      <label>
        Customer Email
        <input
          required
          type="email"
          value={form.customerEmail}
          onChange={(event) => updateField('customerEmail', event.target.value)}
          placeholder="customer@example.com"
        />
      </label>

      <label>
        Customer Phone Number
        <input
          required
          value={form.customerPhone}
          onChange={(event) => updateField('customerPhone', event.target.value)}
          placeholder="+94 77 123 4567"
        />
      </label>

      <label>
        Date Added
        <input
          required
          type="date"
          value={form.dateAdded}
          onChange={(event) => updateField('dateAdded', event.target.value)}
        />
      </label>

      <label className="upload-field">
        <span>Vehicle Photo</span>
        <div className="upload-box">
          {form.photo ? <img src={form.photo} alt="Vehicle preview" /> : <ImagePlus size={34} />}
          <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        </div>
      </label>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          <X size={18} />
          Cancel
        </button>
        <button type="submit" className="primary-button">
          <Save size={18} />
          Save
        </button>
      </div>
    </form>
  );
}
