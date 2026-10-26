'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Airport {
  iata_code: string;
  name: string;
  city: string;
}

interface Flight {
  id: string;
  flight_number: string;
  origin_iata: string;
  destination_iata: string;
  departure_time: string;
  arrival_time: string;
  base_price: string;
  model_name: string;
  dynamic_price: string;
  occupancy_rate: string;
}

interface TicketFare {
  id: 'light' | 'flex' | 'vip';
  title: string;
  tagline: string;
  priceMultiplier: number;
  features: string[];
}

interface Seat {
  flight_seat_id: string;
  status: 'AVAILABLE' | 'OCCUPIED';
  occupied_by_category: 'ADULT' | 'CHILD' | 'INFANT' | null;
  seat_row: number;
  seat_letter: string;
  seat_class: 'BUSINESS' | 'ECONOMY';
  is_emergency_exit: boolean;
  base_seat_fee: string;
}

interface UserSession {
  id: number;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  name?: string;
}

const TICKET_FARES: TicketFare[] = [
  {
    id: 'light',
    title: 'Standard Light',
    tagline: 'Esențial pentru călători rapide',
    priceMultiplier: 1.0,
    features: ['1x Ghiozdan de mână (40x30x20 cm)', 'Check-in online gratuit cu 24h înainte'],
  },
  {
    id: 'flex',
    title: 'Smart Flex',
    tagline: 'Confort sporit și flexibilitate',
    priceMultiplier: 1.35,
    features: ['1x Troller de cabină (10kg)', '1x Bagaj de cală (23kg)', 'Anulare/Modificare gratuită'],
  },
  {
    id: 'vip',
    title: 'Executive VIP',
    tagline: 'Experiență premium completă',
    priceMultiplier: 1.8,
    features: ['2x Bagaj cală (32kg)', 'Acces Fast Track & Lounge VIP', 'Mâncare & Bauturi Premium incluse'],
  },
];

export default function FlightBookingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Autentificare
  const [user, setUser] = useState<UserSession | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authError, setAuthError] = useState('');

  // Căutare rapidă bilet din Header
  const [headerRefSearch, setHeaderRefSearch] = useState('');

  // Căutare Zboruri
  const [airports] = useState<Airport[]>([
    { iata_code: 'OTP', name: 'Henri Coandă', city: 'București' },
    { iata_code: 'LHR', name: 'Heathrow', city: 'Londra' },
    { iata_code: 'CLJ', name: 'Avram Iancu', city: 'Cluj-Napoca' },
    { iata_code: 'CDG', name: 'Charles de Gaulle', city: 'Paris' },
  ]);
  const [origin, setOrigin] = useState('OTP');
  const [destination, setDestination] = useState('LHR');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedFare, setSelectedFare] = useState<TicketFare>(TICKET_FARES[0]);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(false);

  // Pop-up Confirmare
  const [bookingSuccessData, setBookingSuccessData] = useState<{
    bookingReference: string;
    seat: string;
    price: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setUser(data.user);
        })
        .catch((err) => console.error('Sesiune nevalidă', err));
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
        authMode === 'login'
            ? { email: authEmail, password: authPassword }
            : { email: authEmail, password: authPassword, firstName: authFirstName, lastName: authLastName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'A apărut o eroare');
      } else {
        if (authMode === 'register') {
          setAuthMode('login');
          setAuthError('Cont creat! Te poți autentifica.');
        } else {
          setUser(data.user);
          setAuthModalOpen(false);
          setAuthPassword('');
        }
      }
    } catch {
      setAuthError('Eroare conexiune server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerRefSearch.trim()) return;
    router.push(`/boarding-pass/${headerRefSearch.trim().toUpperCase()}`);
  };

  const handleSearchFlights = () => {
    setLoading(true);
    fetch(`/api/flights?origin=${origin}&destination=${destination}`)
        .then((res) => res.json())
        .then((data) => {
          setFlights(data);
          setLoading(false);
          setStep(2);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
  };

  const handleProceedToSeats = () => {
    if (!selectedFlight) return;
    setLoading(true);
    fetch(`/api/flights/${selectedFlight.id}/seats`)
        .then((res) => res.json())
        .then((data) => {
          setSeats(data);
          setLoading(false);
          setStep(4);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
  };

  const calculateTotalPrice = () => {
    if (!selectedFlight) return 0;
    const baseDynamic = Number(selectedFlight.dynamic_price);
    const farePrice = baseDynamic * selectedFare.priceMultiplier;
    const seatFee = selectedSeat ? Number(selectedSeat.base_seat_fee) : 0;
    return farePrice + seatFee;
  };

  return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">

        {/* HEADER PRINCIPAL */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-lg sticky top-0 z-40 px-6 py-3.5">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-lg group-hover:scale-105 transition">
                ✈
              </div>
              <span className="font-bold text-lg text-white tracking-wide">AeroReserve</span>
            </Link>

            {/* CĂUTARE RAPIDĂ BILET DUPĂ COD */}
            <form onSubmit={handleHeaderSearch} className="hidden md:flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-amber-400/80 transition">
              <span className="text-slate-500 text-xs mr-2">🔍</span>
              <input
                  type="text"
                  placeholder="Verifică Bilet (ex: AER-3WC3)..."
                  value={headerRefSearch}
                  onChange={(e) => setHeaderRefSearch(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none w-48 font-mono placeholder:font-sans placeholder:text-slate-500"
              />
              <button type="submit" className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2 py-1 rounded ml-1 transition">
                Căutare
              </button>
            </form>

            {/* MENIU UTILIZATOR */}
            <div className="flex items-center gap-3">
              {user ? (
                  <div className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
                    >
                  <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 font-black flex items-center justify-center text-[10px]">
                    {user.email.substring(0, 2).toUpperCase()}
                  </span>
                      <span>{user.name || user.email}</span>
                      {user.role === 'ADMIN' && (
                          <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                      ADMIN
                    </span>
                      )}
                      <span className="text-slate-500 text-[10px]">▼</span>
                    </button>

                    {/* DROPDOWN MENU */}
                    {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl">
                          <div className="px-4 py-2 border-b border-slate-800/80 text-[11px] text-slate-400">
                            Conectat ca <b className="text-white block truncate">{user.email}</b>
                          </div>

                          <Link
                              href="/my-bookings"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition"
                          >
                            <span>🎫</span>
                            <span>Rezervările Mele</span>
                          </Link>

                          <Link
                              href="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition"
                          >
                            <span>👤</span>
                            <span>Profil & Setări</span>
                          </Link>

                          {user.role === 'ADMIN' && (
                              <Link
                                  href="/admin"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-amber-400 hover:bg-slate-800 transition font-bold"
                              >
                                <span>⚙️</span>
                                <span>Panou Admin</span>
                              </Link>
                          )}

                          <div className="border-t border-slate-800/80 mt-1 pt-1">
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition font-bold cursor-pointer"
                            >
                              <span>🚪</span>
                              <span>Deconectare</span>
                            </button>
                          </div>
                        </div>
                    )}
                  </div>
              ) : (
                  <button
                      onClick={() => {
                        setAuthError('');
                        setAuthModalOpen(true);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Autentificare / Cont Nou
                  </button>
              )}
            </div>
          </div>
        </header>

        {/* BARĂ DE PROGRES REZERVARE */}
        <div className="bg-slate-950/60 border-b border-slate-800/60 py-2.5 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-xs font-medium">
            <StepBadge num={1} label="Căutare" active={step === 1} completed={step > 1} />
            <span className="text-slate-700">➔</span>
            <StepBadge num={2} label="Selectare Zbor" active={step === 2} completed={step > 2} />
            <span className="text-slate-700">➔</span>
            <StepBadge num={3} label="Pachet Bilet" active={step === 3} completed={step > 3} />
            <span className="text-slate-700">➔</span>
            <StepBadge num={4} label="Alegere Loc" active={step === 4} completed={false} />
          </div>
        </div>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col justify-center">
          {/* PASUL 1: CĂUTARE */}
          {step === 1 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto w-full shadow-2xl backdrop-blur-xl">
                <h2 className="text-2xl font-black text-white mb-2 text-center">Unde dorești să călătorești?</h2>
                <p className="text-xs text-slate-400 mb-8 text-center">
                  Alege rutele disponibile pentru verificare tarife în timp real.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Aeroport Plecare
                    </label>
                    <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition"
                    >
                      {airports.map((ap) => (
                          <option key={ap.iata_code} value={ap.iata_code}>
                            {ap.city} ({ap.iata_code}) — {ap.name}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Aeroport Destinație
                    </label>
                    <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition"
                    >
                      {airports
                          .filter((ap) => ap.iata_code !== origin)
                          .map((ap) => (
                              <option key={ap.iata_code} value={ap.iata_code}>
                                {ap.city} ({ap.iata_code}) — {ap.name}
                              </option>
                          ))}
                    </select>
                  </div>
                </div>

                <button
                    onClick={handleSearchFlights}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Se caută cursă...' : 'Caută Zboruri Disponibile ➔'}
                </button>
              </div>
          )}

          {/* PASUL 2: LISTA ZBORURI */}
          {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Zboruri găsite: {origin} ➔ {destination}
                    </h2>
                    <p className="text-xs text-slate-400">Prețurile includ algoritmul de cerere/ocupare dinamică</p>
                  </div>
                  <button
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    ← Schimbă Căutarea
                  </button>
                </div>

                {flights.length === 0 ? (
                    <div className="bg-slate-900/50 p-12 text-center rounded-2xl border border-slate-800 text-slate-400">
                      Nu s-au găsit zboruri directe pentru această rută. Încearcă <b>OTP ➔ LHR</b>.
                    </div>
                ) : (
                    <div className="grid gap-4">
                      {flights.map((f) => (
                          <div
                              key={f.id}
                              className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 backdrop-blur-md transition flex flex-wrap justify-between items-center gap-6"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5 rounded-md">
                          Cursa {f.flight_number}
                        </span>
                                <span className="text-xs text-slate-400">{f.model_name}</span>
                              </div>
                              <div className="text-lg font-bold text-white">
                                {new Date(f.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ➔{' '}
                                {new Date(f.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-slate-400">Grad ocupare cursă: {f.occupancy_rate}</div>
                            </div>

                            <div className="text-right flex items-center gap-6">
                              <div>
                                <div className="text-xs text-slate-400">Preț Dinamic de la</div>
                                <div className="text-2xl font-black text-amber-400">{f.dynamic_price} €</div>
                              </div>
                              <button
                                  onClick={() => {
                                    setSelectedFlight(f);
                                    setStep(3);
                                  }}
                                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs transition shadow-md shadow-amber-400/20 cursor-pointer"
                              >
                                Selectează Cursa ➔
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}

          {/* PASUL 3: PACHETE BILETE */}
          {step === 3 && selectedFlight && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Alege Pachetul de Călătorie</h2>
                    <p className="text-xs text-slate-400">Cursa {selectedFlight.flight_number} ({origin} ➔ {destination})</p>
                  </div>
                  <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                    ← Înapoi la Zboruri
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {TICKET_FARES.map((fare) => {
                    const farePrice = (Number(selectedFlight.dynamic_price) * fare.priceMultiplier).toFixed(2);
                    const isSelected = selectedFare.id === fare.id;

                    return (
                        <div
                            key={fare.id}
                            onClick={() => setSelectedFare(fare)}
                            className={`cursor-pointer rounded-2xl p-6 border transition flex flex-col justify-between ${
                                isSelected
                                    ? 'bg-gradient-to-b from-slate-900 to-amber-950/30 border-amber-400 shadow-xl shadow-amber-500/10'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg text-white">{fare.title}</h3>
                              {isSelected && <span className="text-amber-400 font-bold text-xs">✓ Selectat</span>}
                            </div>
                            <p className="text-xs text-slate-400 mb-6">{fare.tagline}</p>

                            <div className="space-y-2 mb-8">
                              {fare.features.map((feat, i) => (
                                  <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                                    <span className="text-amber-400">✔</span> {feat}
                                  </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-slate-800/80 pt-4 flex justify-between items-baseline">
                            <span className="text-xs text-slate-400">Total Pachet:</span>
                            <span className="text-xl font-black text-amber-400">{farePrice} €</span>
                          </div>
                        </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                      onClick={handleProceedToSeats}
                      disabled={loading}
                      className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold px-8 py-4 rounded-xl text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
                  >
                    {loading ? 'Se încarcă cabina...' : 'Alege Locul în Avion ➔'}
                  </button>
                </div>
              </div>
          )}

          {/* PASUL 4: SEAT MAP */}
          {step === 4 && selectedFlight && (
              <div className="flex flex-col items-center w-full">
                <div className="w-full flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Selectare Fotoliu Cabină</h2>
                    <p className="text-xs text-slate-400">
                      Pachet {selectedFare.title} • Zbor {selectedFlight.flight_number}
                    </p>
                  </div>
                  <button onClick={() => setStep(3)} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                    ← Înapoi la Pachete
                  </button>
                </div>

                {/* FUSELAJ ORIZONTAL */}
                <div className="w-full overflow-x-auto pb-8 pt-4">
                  <div className="w-max flex items-center bg-slate-950 border-2 border-slate-800 rounded-2xl py-6 px-6 shadow-2xl relative my-2 mx-auto">
                    <div className="relative w-44 h-56 flex items-center justify-end pr-2 border-r-2 border-slate-800/80 mr-4 shrink-0">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-center">
                        <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-extrabold uppercase">
                          👨‍✈️ COCKPIT
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5 z-10 items-center shrink-0">
                      {Array.from(new Set(seats.map((s) => s.seat_row)))
                          .sort((a, b) => a - b)
                          .map((rowNum) => {
                            const rowSeats = seats.filter((s) => s.seat_row === rowNum);
                            const topSeats = rowSeats.filter((s) => ['A', 'B'].includes(s.seat_letter));
                            const bottomSeats = rowSeats.filter((s) => ['C', 'D'].includes(s.seat_letter));

                            const isVIP = rowNum <= 3;
                            const isBusiness = rowNum >= 4 && rowNum <= 10;

                            return (
                                <div key={rowNum} className="flex flex-col items-center gap-2 p-1 rounded-xl shrink-0">
                                  <div className="flex flex-col gap-1.5">
                                    {topSeats.map((seat) => (
                                        <SeatButton
                                            key={seat.flight_seat_id}
                                            seat={seat}
                                            isVIP={isVIP}
                                            isBusiness={isBusiness}
                                            isSelected={selectedSeat?.flight_seat_id === seat.flight_seat_id}
                                            onSelect={() => setSelectedSeat(seat)}
                                        />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-slate-500">{rowNum}</span>
                                  <div className="flex flex-col gap-1.5">
                                    {bottomSeats.map((seat) => (
                                        <SeatButton
                                            key={seat.flight_seat_id}
                                            seat={seat}
                                            isVIP={isVIP}
                                            isBusiness={isBusiness}
                                            isSelected={selectedSeat?.flight_seat_id === seat.flight_seat_id}
                                            onSelect={() => setSelectedSeat(seat)}
                                        />
                                    ))}
                                  </div>
                                </div>
                            );
                          })}
                    </div>
                  </div>
                </div>

                {/* SUMAR BILET & FINALIZARE REZERVARE */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full mt-2 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Total Final de Plată</div>
                    <div className="text-2xl font-black text-amber-400">{calculateTotalPrice().toFixed(2)} €</div>
                  </div>

                  {selectedSeat ? (
                      <div className="text-xs bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
                        Loc: <b className="text-amber-400">{selectedSeat.seat_row}{selectedSeat.seat_letter}</b> ({selectedSeat.seat_class})
                      </div>
                  ) : (
                      <div className="text-xs text-slate-500 italic">Selectează un loc din cabină</div>
                  )}

                  <button
                      disabled={!selectedSeat || loading}
                      onClick={async () => {
                        if (!selectedSeat || !selectedFlight) return;

                        setLoading(true);
                        try {
                          const res = await fetch('/api/bookings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              flightId: selectedFlight.id,
                              flightSeatId: selectedSeat.flight_seat_id,
                              passengerName: user ? user.name || user.email : 'Pasager AeroReserve',
                              passengerType: 'ADULT',
                              totalPrice: calculateTotalPrice(),
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setBookingSuccessData({
                              bookingReference: data.bookingReference,
                              seat: `${selectedSeat.seat_row}${selectedSeat.seat_letter}`,
                              price: calculateTotalPrice(),
                            });
                          } else {
                            alert('Eroare: ' + data.error);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`px-6 py-3 rounded-xl text-xs font-bold transition shadow-lg ${
                          selectedSeat
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 cursor-pointer shadow-amber-400/20'
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                      }`}
                  >
                    {loading ? 'Se procesează...' : 'Cumpără Biletul ➔'}
                  </button>
                </div>
              </div>
          )}
        </main>

        {/* MODAL AUTH */}
        {authModalOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative border-amber-500/20">
                <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-white">{authMode === 'login' ? 'Autentificare' : 'Creare Cont'}</h3>
                </div>
                {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{authError}</div>}
                <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                  {authMode === 'register' && (
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Prenume" required value={authFirstName} onChange={(e) => setAuthFirstName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" />
                        <input type="text" placeholder="Nume" required value={authLastName} onChange={(e) => setAuthLastName(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" />
                      </div>
                  )}
                  <input type="email" placeholder="Email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" />
                  <input type="password" placeholder="Parolă" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white" />
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-400/20">
                    {loading ? 'Procesare...' : authMode === 'login' ? 'Intră în Cont ➔' : 'Creează Contul ➔'}
                  </button>
                </form>
              </div>
            </div>
        )}

        {/* MODAL SUCCESS */}
        {bookingSuccessData && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative border-amber-500/30">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20">🎉</div>
                <h3 className="text-2xl font-black text-white">Rezervare Confirmată!</h3>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Cod Referință</div>
                  <div className="text-2xl font-mono font-black text-amber-400">{bookingSuccessData.bookingReference}</div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setBookingSuccessData(null)} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs">Închide</button>
                  <Link href={`/boarding-pass/${bookingSuccessData.bookingReference}`} className="flex-1 py-3 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-400/20 text-center">Vezi Bilet ➔</Link>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}

function StepBadge({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) {
  return (
      <div className={`flex items-center gap-1.5 ${active ? 'text-amber-400 font-bold' : completed ? 'text-slate-300' : 'text-slate-600'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-amber-400 text-slate-950 font-bold' : completed ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
        {num}
      </span>
        <span>{label}</span>
      </div>
  );
}

function SeatButton({ seat, isSelected, isVIP, isBusiness, onSelect }: { seat: Seat; isSelected: boolean; isVIP?: boolean; isBusiness?: boolean; onSelect: () => void }) {
  const isOccupied = seat.status === 'OCCUPIED';
  let style = 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 cursor-pointer';
  if (isVIP) style = 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-pointer';
  else if (isBusiness) style = 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-pointer';

  let icon = seat.seat_letter;
  if (isOccupied) {
    style = 'cursor-not-allowed border-transparent text-white opacity-80 bg-slate-700';
    icon = '👤';
  } else if (isSelected) {
    style = 'bg-amber-400 text-slate-950 font-black border-2 border-white shadow-lg shadow-amber-400/50 scale-105 z-10';
  }

  return (
      <button disabled={isOccupied} onClick={onSelect} className={`w-9 h-9 text-xs font-bold rounded-lg border transition duration-150 flex items-center justify-center shadow ${style}`}>
        {icon}
      </button>
  );
}