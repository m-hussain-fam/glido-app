import { create } from 'zustand';

interface Coords {
  lat: number;
  lon: number;
}

interface RideState {
  from: string;
  to: string;
  fromCoords: Coords | null;
  toCoords: Coords | null;
  vehicle: string;
  vehicleEmoji: string;
  fare: number;

  setFrom: (label: string, coords: Coords) => void;
  setTo: (label: string, coords: Coords) => void;
  setVehicle: (id: string, emoji: string, fare: number) => void;
  reset: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  from: '',
  to: '',
  fromCoords: null,
  toCoords: null,
  vehicle: '',
  vehicleEmoji: '',
  fare: 0,

  setFrom: (label, coords) => set({ from: label, fromCoords: coords }),
  setTo: (label, coords) => set({ to: label, toCoords: coords }),
  setVehicle: (id, emoji, fare) => set({ vehicle: id, vehicleEmoji: emoji, fare }),
  reset: () => set({ from: '', to: '', fromCoords: null, toCoords: null, vehicle: '', vehicleEmoji: '', fare: 0 }),
}));
