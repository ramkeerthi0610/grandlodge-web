import React, { useMemo, useState } from "react";
import "./App.css";

const INITIAL_ROOMS = [
  { id: "DLX-101", type: "Deluxe", floor: 1, rate: 180, status: "vacant" },
  { id: "SUP-203", type: "Superior", floor: 2, rate: 220, status: "occupied" },
  { id: "STD-118", type: "Standard", floor: 1, rate: 120, status: "maintenance" },
  { id: "STE-305", type: "Suite", floor: 3, rate: 320, status: "vacant" },
  { id: "DLX-208", type: "Deluxe", floor: 2, rate: 190, status: "occupied" }
];

const INITIAL_BOOKINGS = [
  {
    id: 1,
    guest: "Sophia Turner",
    roomId: "SUP-203",
    checkIn: "2026-05-01",
    checkOut: "2026-05-04",
    total: 660,
    status: "checked-in"
  },
  {
    id: 2,
    guest: "Liam Carter",
    roomId: "DLX-208",
    checkIn: "2026-05-01",
    checkOut: "2026-05-03",
    total: 380,
    status: "checked-in"
  }
];

function App() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [filters, setFilters] = useState({ status: "all", floor: "all" });
  const [form, setForm] = useState({ guest: "", roomId: "", nights: 1 });
  const [message, setMessage] = useState("");

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.status === "vacant"),
    [rooms]
  );

  const visibleRooms = useMemo(() => {
    return rooms.filter((room) => {
      const statusMatch = filters.status === "all" || room.status === filters.status;
      const floorMatch = filters.floor === "all" || String(room.floor) === filters.floor;
      return statusMatch && floorMatch;
    });
  }, [rooms, filters]);

  const metrics = useMemo(() => {
    const occupied = rooms.filter((r) => r.status === "occupied").length;
    const revenue = bookings.reduce((sum, booking) => sum + booking.total, 0);
    return {
      totalRooms: rooms.length,
      occupied,
      occupancyRate: Math.round((occupied / rooms.length) * 100),
      revenue
    };
  }, [rooms, bookings]);

  const createBooking = (event) => {
    event.preventDefault();
    setMessage("");

    const selectedRoom = rooms.find((room) => room.id === form.roomId);
    if (!form.guest.trim() || !selectedRoom) {
      setMessage("Please provide guest name and select a vacant room.");
      return;
    }

    const nights = Number(form.nights);
    const now = new Date();
    const checkIn = now.toISOString().slice(0, 10);
    const checkOutDate = new Date(now);
    checkOutDate.setDate(checkOutDate.getDate() + nights);

    const nextBooking = {
      id: bookings.length + 1,
      guest: form.guest.trim(),
      roomId: selectedRoom.id,
      checkIn,
      checkOut: checkOutDate.toISOString().slice(0, 10),
      total: selectedRoom.rate * nights,
      status: "reserved"
    };

    setBookings((current) => [nextBooking, ...current]);
    setRooms((current) =>
      current.map((room) =>
        room.id === selectedRoom.id ? { ...room, status: "occupied" } : room
      )
    );
    setForm({ guest: "", roomId: "", nights: 1 });
    setMessage(`Booking created for ${nextBooking.guest} in room ${nextBooking.roomId}.`);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>GrandLodge Hotel Management</h1>
        <p>Modern operations dashboard for rooms, occupancy, and bookings.</p>
      </header>

      <section className="metrics-grid">
        <article className="metric-card"><span>Total Rooms</span><strong>{metrics.totalRooms}</strong></article>
        <article className="metric-card"><span>Occupied</span><strong>{metrics.occupied}</strong></article>
        <article className="metric-card"><span>Occupancy</span><strong>{metrics.occupancyRate}%</strong></article>
        <article className="metric-card"><span>Revenue</span><strong>${metrics.revenue}</strong></article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Quick Booking</h2>
          <form onSubmit={createBooking} className="booking-form">
            <label>
              Guest Name
              <input
                value={form.guest}
                onChange={(event) => setForm({ ...form, guest: event.target.value })}
                placeholder="Enter guest name"
              />
            </label>
            <label>
              Vacant Room
              <select
                value={form.roomId}
                onChange={(event) => setForm({ ...form, roomId: event.target.value })}
              >
                <option value="">Select room</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.id} · {room.type} · ${room.rate}/night
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nights
              <input
                type="number"
                min="1"
                max="30"
                value={form.nights}
                onChange={(event) => setForm({ ...form, nights: event.target.value })}
              />
            </label>
            <button type="submit">Create Booking</button>
          </form>
          {message && <p className="message">{message}</p>}
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Room Inventory</h2>
            <div className="filters">
              <select
                value={filters.status}
                onChange={(event) => setFilters({ ...filters, status: event.target.value })}
              >
                <option value="all">All Status</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select
                value={filters.floor}
                onChange={(event) => setFilters({ ...filters, floor: event.target.value })}
              >
                <option value="all">All Floors</option>
                <option value="1">Floor 1</option>
                <option value="2">Floor 2</option>
                <option value="3">Floor 3</option>
              </select>
            </div>
          </div>
          <ul className="list">
            {visibleRooms.map((room) => (
              <li key={room.id} className="list-item">
                <div>
                  <strong>{room.id}</strong>
                  <p>{room.type} · Floor {room.floor}</p>
                </div>
                <span className={`badge ${room.status}`}>{room.status}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <h2>Recent Bookings</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th><th>Room</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.guest}</td>
                  <td>{booking.roomId}</td>
                  <td>{booking.checkIn}</td>
                  <td>{booking.checkOut}</td>
                  <td>{booking.status}</td>
                  <td>${booking.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;
