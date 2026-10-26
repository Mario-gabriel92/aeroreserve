'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
// --- INTERFEȚE ---
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

// Adăugăm tipul explicit :Variants
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } }
};

export default function FlightBookingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [user, setUser] = useState<UserSession | null>(null);

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
      <div className="flex-1 flex flex-col font-sans">

        {/* BARĂ DE PROGRES REZERVARE */}
        <div className="bg-slate-950/60 border-b border-slate-800/60 py-3 px-6 sticky top-[68px] z-30 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-xs font-medium">
            <StepBadge num={1} label="Căutare" active={step === 1} completed={step > 1} />
            <span className="text-slate-700">➔</span>
            <StepBadge num={2} label="Selectare Zbor" active={step === 2} completed={step > 2} />
            <span className="text-slate-700">➔</span>
            <StepBadge num={3} label="Pachet Bilet" active={step === 3} completed={step > 3} />
            <span className="text-slate-700">➔</span>
            <StepBadge num={4} label="Alegere Loc" active={step === 4} completed={false} />
          </div>
        </div>

        <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">

            {/* PASUL 1: CĂUTARE */}
            {step === 1 && (
                <motion.div
                    key="step1"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto w-full shadow-2xl backdrop-blur-xl"
                >
                  <h2 className="text-2xl font-black text-white mb-2 text-center">Unde dorești să călătorești?</h2>
                  <p className="text-xs text-slate-400 mb-8 text-center">
                    Alege rutele disponibile pentru verificare tarife în timp real.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Aeroport Plecare
                      </label>
                      <select
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition cursor-pointer"
                      >
                        {airports.map((ap) => (
                            <option key={ap.iata_code} value={ap.iata_code}>
                              {ap.city} ({ap.iata_code})
                            </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Aeroport Destinație
                      </label>
                      <select
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/50 transition cursor-pointer"
                      >
                        {airports.filter((ap) => ap.iata_code !== origin).map((ap) => (
                            <option key={ap.iata_code} value={ap.iata_code}>
                              {ap.city} ({ap.iata_code})
                            </option>
                        ))}
                      </select>
                    </motion.div>
                  </div>

                  <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0px 0px 20px rgba(245, 158, 11, 0.4)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSearchFlights}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? 'Se caută cursă...' : 'Caută Zboruri Disponibile ➔'}
                  </motion.button>
                </motion.div>
            )}

            {/* PASUL 2: LISTA ZBORURI */}
            {step === 2 && (
                <motion.div
                    key="step2"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6 w-full"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Zboruri găsite: {origin} ➔ {destination}
                      </h2>
                      <p className="text-xs text-slate-400">Prețurile includ algoritmul de cerere/ocupare dinamică</p>
                    </div>
                    <button
                        onClick={() => setStep(1)}
                        className="text-xs text-slate-400 hover:text-amber-400 transition-colors underline cursor-pointer"
                    >
                      ← Schimbă Căutarea
                    </button>
                  </div>

                  {flights.length === 0 ? (
                      <div className="bg-slate-900/50 p-12 text-center rounded-2xl border border-slate-800 text-slate-400">
                        Nu s-au găsit zboruri directe pentru această rută. Încearcă <b>OTP ➔ LHR</b>.
                      </div>
                  ) : (
                      <motion.div
                          variants={listContainerVariants}
                          initial="hidden"
                          animate="visible"
                          className="grid gap-4"
                      >
                        {flights.map((f) => (
                            <motion.div
                                key={f.id}
                                variants={listItemVariants}
                                whileHover={{ scale: 1.01, borderColor: "rgba(245, 158, 11, 0.5)" }}
                                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md transition flex flex-wrap justify-between items-center gap-6 shadow-lg"
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
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setSelectedFlight(f); setStep(3); }}
                                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-3 rounded-xl text-xs transition shadow-md shadow-amber-400/20 cursor-pointer"
                                >
                                  Selectează ➔
                                </motion.button>
                              </div>
                            </motion.div>
                        ))}
                      </motion.div>
                  )}
                </motion.div>
            )}

            {/* PASUL 3: PACHETE BILETE */}
            {step === 3 && selectedFlight && (
                <motion.div
                    key="step3"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6 w-full"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Alege Pachetul de Călătorie</h2>
                      <p className="text-xs text-slate-400">Cursa {selectedFlight.flight_number} ({origin} ➔ {destination})</p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-amber-400 transition-colors underline cursor-pointer">
                      ← Înapoi la Zboruri
                    </button>
                  </div>

                  <motion.div
                      variants={listContainerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {TICKET_FARES.map((fare) => {
                      const farePrice = (Number(selectedFlight.dynamic_price) * fare.priceMultiplier).toFixed(2);
                      const isSelected = selectedFare.id === fare.id;

                      return (
                          <motion.div
                              key={fare.id}
                              variants={listItemVariants}
                              whileHover={{ y: -8, boxShadow: "0px 15px 30px rgba(0,0,0,0.4)" }}
                              onClick={() => setSelectedFare(fare)}
                              className={`cursor-pointer rounded-2xl p-6 border transition-colors duration-300 flex flex-col justify-between relative overflow-hidden ${
                                  isSelected
                                      ? 'bg-gradient-to-b from-slate-900 to-amber-950/40 border-amber-400 shadow-xl shadow-amber-500/10'
                                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                              }`}
                          >
                            {isSelected && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                            )}
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-white">{fare.title}</h3>
                                {isSelected && (
                                    <motion.span
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="text-amber-400 font-bold text-xs bg-amber-400/10 px-2 py-1 rounded"
                                    >
                                      ✓ Selectat
                                    </motion.span>
                                )}
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
                          </motion.div>
                      );
                    })}
                  </motion.div>

                  <div className="flex justify-end pt-4">
                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0px 0px 20px rgba(245, 158, 11, 0.4)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleProceedToSeats}
                        disabled={loading}
                        className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold px-8 py-4 rounded-xl text-sm shadow-xl transition cursor-pointer disabled:opacity-70"
                    >
                      {loading ? 'Se încarcă cabina...' : 'Alege Locul în Avion ➔'}
                    </motion.button>
                  </div>
                </motion.div>
            )}

            {/* PASUL 4: SEAT MAP */}
            {step === 4 && selectedFlight && (
                <motion.div
                    key="step4"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col items-center w-full"
                >
                  <div className="w-full flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Selectare Fotoliu Cabină</h2>
                      <p className="text-xs text-slate-400">
                        Pachet {selectedFare.title} • Zbor {selectedFlight.flight_number}
                      </p>
                    </div>
                    <button onClick={() => setStep(3)} className="text-xs text-slate-400 hover:text-amber-400 transition-colors underline cursor-pointer">
                      ← Înapoi la Pachete
                    </button>
                  </div>

                  {/* FUSELAJ ORIZONTAL */}
                  <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-full overflow-x-auto pb-8 pt-4 custom-scrollbar"
                  >
                    <div className="w-max flex items-center bg-slate-950/80 backdrop-blur-sm border-2 border-slate-800 rounded-3xl py-8 px-8 shadow-2xl relative my-2 mx-auto">
                      <div className="relative w-44 h-56 flex items-center justify-end pr-4 border-r-2 border-slate-800/80 mr-6 shrink-0">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-center">
                          <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-extrabold uppercase bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">
                            👨‍✈️ COCKPIT
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 z-10 items-center shrink-0">
                        {Array.from(new Set(seats.map((s) => s.seat_row)))
                            .sort((a, b) => a - b)
                            .map((rowNum) => {
                              const rowSeats = seats.filter((s) => s.seat_row === rowNum);
                              const topSeats = rowSeats.filter((s) => ['A', 'B'].includes(s.seat_letter));
                              const bottomSeats = rowSeats.filter((s) => ['C', 'D'].includes(s.seat_letter));

                              const isVIP = rowNum <= 3;
                              const isBusiness = rowNum >= 4 && rowNum <= 10;

                              return (
                                  <div key={rowNum} className="flex flex-col items-center gap-2 p-1.5 rounded-xl shrink-0">
                                    <div className="flex flex-col gap-2">
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
                                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md my-1">{rowNum}</span>
                                    <div className="flex flex-col gap-2">
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
                  </motion.div>

                  {/* SUMAR BILET & FINALIZARE REZERVARE */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full mt-2 shadow-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
                    <div>
                      <div className="text-xs text-slate-400">Total Final de Plată</div>
                      <div className="text-2xl font-black text-amber-400">{calculateTotalPrice().toFixed(2)} €</div>
                    </div>

                    {selectedSeat ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xs bg-slate-950 px-4 py-2.5 rounded-xl border border-amber-500/30 text-slate-300 flex items-center gap-2"
                        >
                          Loc: <span className="text-amber-400 font-black text-lg">{selectedSeat.seat_row}{selectedSeat.seat_letter}</span>
                          <span className="bg-slate-800 px-2 py-1 rounded text-[10px] uppercase">{selectedSeat.seat_class}</span>
                        </motion.div>
                    ) : (
                        <div className="text-xs text-slate-500 italic bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800/50">Selectează un loc din cabină</div>
                    )}

                    <motion.button
                        whileHover={selectedSeat ? { scale: 1.05, boxShadow: "0px 0px 20px rgba(245, 158, 11, 0.4)" } : {}}
                        whileTap={selectedSeat ? { scale: 0.95 } : {}}
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
                        className={`px-8 py-4 rounded-xl text-sm font-bold transition shadow-lg ${
                            selectedSeat
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                        }`}
                    >
                      {loading ? 'Se procesează...' : 'Cumpără Biletul ➔'}
                    </motion.button>
                  </div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* MODAL SUCCESS */}
        <AnimatePresence>
          {bookingSuccessData && (
              <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative border-amber-500/30 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 animate-pulse"></div>
                  <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-lg shadow-amber-500/30">🎉</div>
                  <h3 className="text-2xl font-black text-white">Rezervare Confirmată!</h3>
                  <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cod Referință</div>
                    <div className="text-3xl font-mono font-black text-amber-400">{bookingSuccessData.bookingReference}</div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setBookingSuccessData(null)} className="flex-1 py-3.5 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 transition">Închide</motion.button>
                    <Link href={`/boarding-pass/${bookingSuccessData.bookingReference}`} className="flex-1">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-400/20 text-center hover:bg-amber-300 transition">
                        Vezi Bilet ➔
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}

function StepBadge({ num, label, active, completed }: { num: number; label: string; active: boolean; completed: boolean }) {
  return (
      <motion.div
          initial={false}
          animate={{ scale: active ? 1.05 : 1 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${active ? 'bg-slate-900 border border-slate-800 text-amber-400 font-bold shadow-lg' : completed ? 'text-slate-300' : 'text-slate-600'}`}
      >
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${active ? 'bg-amber-400 text-slate-950 font-bold' : completed ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
        {completed && !active ? '✓' : num}
      </span>
        <span>{label}</span>
      </motion.div>
  );
}

function SeatButton({ seat, isSelected, isVIP, isBusiness, onSelect }: { seat: Seat; isSelected: boolean; isVIP?: boolean; isBusiness?: boolean; onSelect: () => void }) {
  const isOccupied = seat.status === 'OCCUPIED';
  let style = 'bg-slate-800/80 text-slate-300 border-slate-700';
  if (isVIP) style = 'bg-amber-500/10 text-amber-300 border-amber-500/40';
  else if (isBusiness) style = 'bg-blue-500/10 text-blue-300 border-blue-500/30';

  let icon = seat.seat_letter;
  if (isOccupied) {
    style = 'cursor-not-allowed border-transparent text-white opacity-40 bg-slate-800';
    icon = '×';
  } else if (isSelected) {
    style = 'bg-amber-400 text-slate-950 font-black border-2 border-white shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10';
  }

  return (
      <motion.button
          disabled={isOccupied}
          onClick={onSelect}
          whileHover={!isOccupied && !isSelected ? { scale: 1.1, backgroundColor: 'rgba(245,158,11,0.2)' } : {}}
          whileTap={!isOccupied ? { scale: 0.85 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`w-10 h-10 text-xs font-bold rounded-xl border flex items-center justify-center shadow-sm ${style}`}
      >
        {icon}
      </motion.button>
  );
}