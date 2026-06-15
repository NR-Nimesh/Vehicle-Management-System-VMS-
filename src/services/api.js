const STORAGE_KEY = 'vehicle-management-records';

const starterVehicles = [
  {
    id: 'veh-1001',
    vehicleNumber: 'CAB-4582',
    vehicleDescription: 'Toyota Prius hybrid, black exterior, recently serviced.',
    photo: '',
    customerName: 'Nimal Perera',
    customerEmail: 'nimal.perera@example.com',
    customerPhone: '+94 77 123 4567',
    dateAdded: '2026-06-15',
  },
  {
    id: 'veh-1002',
    vehicleNumber: 'VAN-9041',
    vehicleDescription: 'Nissan Caravan passenger van with full service history.',
    photo: '',
    customerName: 'Anika Silva',
    customerEmail: 'anika.silva@example.com',
    customerPhone: '+94 71 555 0199',
    dateAdded: '2026-06-14',
  },
];

function readStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterVehicles));
    return starterVehicles;
  }

  return JSON.parse(stored);
}

function writeStorage(vehicles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  return vehicles;
}

export function getVehicles() {
  return readStorage();
}

export function createVehicle(vehicle) {
  const nextVehicle = { ...vehicle, id: crypto.randomUUID() };
  writeStorage([nextVehicle, ...readStorage()]);
  return nextVehicle;
}

export function updateVehicle(id, vehicle) {
  const nextVehicle = { ...vehicle, id };
  writeStorage(readStorage().map((item) => (item.id === id ? nextVehicle : item)));
  return nextVehicle;
}

export function deleteVehicle(id) {
  writeStorage(readStorage().filter((vehicle) => vehicle.id !== id));
}
