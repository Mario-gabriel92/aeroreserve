import random
import uuid
from locust import HttpUser, task, between

AIRPORTS = ["OTP", "CLJ", "TSR", "IAS", "LHR", "CDG", "FCO", "MAD", "BER", "AMS", "VIE", "MUC"]

class AeroReserveUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        unique_id = uuid.uuid4().hex[:8]
        self.user_email = f"user_{unique_id}@test.com"
        self.password = "ParolaTest123!"

        reg_response = self.client.post("/api/auth/register", json={
            "email": self.user_email,
            "password": self.password,
            "firstName": "Test",
            "lastName": "Locust"
        })

        if reg_response.status_code in [200, 201]:
            self.client.post("/api/auth/login", json={
                "email": self.user_email,
                "password": self.password
            })

    @task(3)
    def search_flights(self):
        # Alege două aeroporturi diferite din rețeaua completă
        origin, destination = random.sample(AIRPORTS, 2)
        self.client.get(f"/api/flights?origin={origin}&destination={destination}", name="/api/flights (Search)")

    @task(2)
    def view_seats_and_book(self):
        origin, destination = random.sample(AIRPORTS, 2)
        response = self.client.get(f"/api/flights?origin={origin}&destination={destination}", name="/api/flights (Search for Booking)")

        if response.status_code == 200:
            flights = response.json()
            if flights:
                flight = random.choice(flights)
                flight_id = flight.get("id")

                seats_response = self.client.get(f"/api/flights/{flight_id}/seats", name="/api/flights/[id]/seats")
                if seats_response.status_code == 200:
                    seats = seats_response.json()
                    available_seats = [s for s in seats if s.get("status") == "AVAILABLE"]

                    if available_seats:
                        selected_seat = random.choice(available_seats)

                        booking_payload = {
                            "flightId": flight_id,
                            "flightSeatId": selected_seat.get("flight_seat_id"),
                            "passengerName": "Pasager Test Locust",
                            "passengerType": "ADULT",
                            "totalPrice": float(flight.get("dynamic_price", 100)) + float(selected_seat.get("base_seat_fee", 0))
                        }

                        with self.client.post("/api/bookings", json=booking_payload, name="/api/bookings (Create)", catch_response=True) as res:
                            if res.status_code == 200 or res.status_code == 409:
                                res.success()
                            else:
                                res.failure(f"Eroare rezervare: {res.text}")

    @task(1)
    def check_my_bookings(self):
        self.client.get("/api/user/bookings", name="/api/user/bookings")
        #comanda de run locust in power shell python -m locust -f locustfile.py (trebuie sa fii in folderul unde e file ul)