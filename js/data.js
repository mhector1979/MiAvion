// Reference data: airports and airlines used by the simulator and the UI.
window.MA = window.MA || {};

// [IATA, name, city, lat, lon, IANA time zone, terminals]
MA.AIRPORT_ROWS = [
  ["JFK", "John F. Kennedy Intl", "New York", 40.6413, -73.7781, "America/New_York", ["1", "4", "5", "7", "8"]],
  ["EWR", "Newark Liberty Intl", "Newark", 40.6895, -74.1745, "America/New_York", ["A", "B", "C"]],
  ["BOS", "Logan Intl", "Boston", 42.3656, -71.0096, "America/New_York", ["A", "B", "C", "E"]],
  ["ATL", "Hartsfield–Jackson", "Atlanta", 33.6407, -84.4277, "America/New_York", ["N", "S", "I"]],
  ["MIA", "Miami Intl", "Miami", 25.7959, -80.287, "America/New_York", ["N", "C", "S"]],
  ["ORD", "O'Hare Intl", "Chicago", 41.9742, -87.9073, "America/Chicago", ["1", "2", "3", "5"]],
  ["DFW", "Dallas/Fort Worth Intl", "Dallas", 32.8998, -97.0403, "America/Chicago", ["A", "B", "C", "D", "E"]],
  ["DEN", "Denver Intl", "Denver", 39.8561, -104.6737, "America/Denver", ["A", "B", "C"]],
  ["LAX", "Los Angeles Intl", "Los Angeles", 33.9416, -118.4085, "America/Los_Angeles", ["4", "5", "6", "7", "B"]],
  ["SFO", "San Francisco Intl", "San Francisco", 37.6213, -122.379, "America/Los_Angeles", ["1", "2", "3", "I"]],
  ["SEA", "Seattle–Tacoma Intl", "Seattle", 47.4502, -122.3088, "America/Los_Angeles", ["A", "B", "C", "D", "N", "S"]],
  ["HNL", "Daniel K. Inouye Intl", "Honolulu", 21.3245, -157.9251, "Pacific/Honolulu", ["1", "2"]],
  ["YYZ", "Toronto Pearson", "Toronto", 43.6777, -79.6248, "America/Toronto", ["1", "3"]],
  ["YVR", "Vancouver Intl", "Vancouver", 49.1967, -123.1815, "America/Vancouver", ["D", "I"]],
  ["MEX", "Benito Juárez Intl", "Mexico City", 19.4361, -99.0719, "America/Mexico_City", ["1", "2"]],
  ["CUN", "Cancún Intl", "Cancún", 21.0365, -86.8771, "America/Cancun", ["2", "3", "4"]],
  ["GDL", "Guadalajara Intl", "Guadalajara", 20.5218, -103.3112, "America/Mexico_City", ["1", "2"]],
  ["MTY", "Monterrey Intl", "Monterrey", 25.7785, -100.1069, "America/Monterrey", ["A", "B", "C"]],
  ["PTY", "Tocumen Intl", "Panama City", 9.0714, -79.3835, "America/Panama", ["1", "2"]],
  ["BOG", "El Dorado Intl", "Bogotá", 4.7016, -74.1469, "America/Bogota", ["1", "2"]],
  ["LIM", "Jorge Chávez Intl", "Lima", -12.0219, -77.1143, "America/Lima", ["1"]],
  ["SCL", "Arturo Merino Benítez", "Santiago", -33.393, -70.7858, "America/Santiago", ["1", "2"]],
  ["EZE", "Ministro Pistarini", "Buenos Aires", -34.8222, -58.5358, "America/Argentina/Buenos_Aires", ["A", "B", "C"]],
  ["GRU", "Guarulhos Intl", "São Paulo", -23.4356, -46.4731, "America/Sao_Paulo", ["1", "2", "3"]],
  ["LHR", "Heathrow", "London", 51.47, -0.4543, "Europe/London", ["2", "3", "4", "5"]],
  ["LGW", "Gatwick", "London", 51.1537, -0.1821, "Europe/London", ["N", "S"]],
  ["CDG", "Charles de Gaulle", "Paris", 49.0097, 2.5479, "Europe/Paris", ["1", "2E", "2F", "2G"]],
  ["AMS", "Schiphol", "Amsterdam", 52.3105, 4.7683, "Europe/Amsterdam", ["1", "2", "3"]],
  ["FRA", "Frankfurt", "Frankfurt", 50.0379, 8.5622, "Europe/Berlin", ["1", "2"]],
  ["MUC", "Munich", "Munich", 48.3538, 11.7861, "Europe/Berlin", ["1", "2"]],
  ["ZRH", "Zürich", "Zürich", 47.4582, 8.5555, "Europe/Zurich", ["1", "2", "3"]],
  ["MAD", "Adolfo Suárez Madrid–Barajas", "Madrid", 40.4983, -3.5676, "Europe/Madrid", ["1", "2", "4", "4S"]],
  ["BCN", "Josep Tarradellas Barcelona–El Prat", "Barcelona", 41.2974, 2.0833, "Europe/Madrid", ["1", "2"]],
  ["LIS", "Humberto Delgado", "Lisbon", 38.7742, -9.1342, "Europe/Lisbon", ["1", "2"]],
  ["FCO", "Fiumicino", "Rome", 41.8003, 12.2389, "Europe/Rome", ["1", "3"]],
  ["IST", "Istanbul", "Istanbul", 41.2753, 28.7519, "Europe/Istanbul", ["1"]],
  ["CAI", "Cairo Intl", "Cairo", 30.1219, 31.4056, "Africa/Cairo", ["1", "2", "3"]],
  ["JNB", "O. R. Tambo Intl", "Johannesburg", -26.1367, 28.2411, "Africa/Johannesburg", ["A", "B"]],
  ["DXB", "Dubai Intl", "Dubai", 25.2532, 55.3657, "Asia/Dubai", ["1", "2", "3"]],
  ["DOH", "Hamad Intl", "Doha", 25.2731, 51.6081, "Asia/Qatar", ["1"]],
  ["DEL", "Indira Gandhi Intl", "Delhi", 28.5562, 77.1, "Asia/Kolkata", ["1", "2", "3"]],
  ["SIN", "Changi", "Singapore", 1.3644, 103.9915, "Asia/Singapore", ["1", "2", "3", "4"]],
  ["HKG", "Hong Kong Intl", "Hong Kong", 22.308, 113.9185, "Asia/Hong_Kong", ["1", "2"]],
  ["PEK", "Beijing Capital", "Beijing", 40.0799, 116.6031, "Asia/Shanghai", ["2", "3"]],
  ["ICN", "Incheon Intl", "Seoul", 37.4602, 126.4407, "Asia/Seoul", ["1", "2"]],
  ["HND", "Haneda", "Tokyo", 35.5494, 139.7798, "Asia/Tokyo", ["1", "2", "3"]],
  ["NRT", "Narita Intl", "Tokyo", 35.772, 140.3929, "Asia/Tokyo", ["1", "2", "3"]],
  ["SYD", "Kingsford Smith", "Sydney", -33.9399, 151.1753, "Australia/Sydney", ["1", "2", "3"]],
  ["MEL", "Tullamarine", "Melbourne", -37.669, 144.841, "Australia/Melbourne", ["1", "2", "3", "4"]],
  ["AKL", "Auckland", "Auckland", -37.0082, 174.785, "Pacific/Auckland", ["D", "I"]],
];

MA.AIRPORTS = {};
MA.AIRPORT_ROWS.forEach(([iata, name, city, lat, lon, tz, terminals]) => {
  MA.AIRPORTS[iata] = { iata, name, city, lat, lon, tz, terminals };
});

// [IATA, name, color, hubs, registration prefix]
MA.AIRLINE_ROWS = [
  ["AA", "American Airlines", "#2B7BD6", ["DFW", "MIA", "JFK", "ORD", "LAX"], "N"],
  ["DL", "Delta Air Lines", "#C8102E", ["ATL", "JFK", "LAX", "SEA"], "N"],
  ["UA", "United Airlines", "#1F5BB5", ["ORD", "SFO", "EWR", "DEN"], "N"],
  ["B6", "JetBlue", "#2E5FD0", ["JFK", "BOS"], "N"],
  ["AS", "Alaska Airlines", "#1C6E9C", ["SEA", "SFO"], "N"],
  ["HA", "Hawaiian Airlines", "#7B2A8C", ["HNL"], "N"],
  ["AC", "Air Canada", "#E0262F", ["YYZ", "YVR"], "C-"],
  ["AM", "Aeroméxico", "#1C3A6E", ["MEX", "MTY", "GDL"], "XA-"],
  ["Y4", "Volaris", "#A3007D", ["GDL", "MEX", "CUN"], "XA-"],
  ["CM", "Copa Airlines", "#1D5AA8", ["PTY"], "HP-"],
  ["AV", "Avianca", "#D92B2B", ["BOG"], "N"],
  ["LA", "LATAM", "#D6203A", ["SCL", "LIM", "GRU"], "CC-"],
  ["AR", "Aerolíneas Argentinas", "#2D7FD1", ["EZE"], "LV-"],
  ["BA", "British Airways", "#1D5FAE", ["LHR", "LGW"], "G-"],
  ["VS", "Virgin Atlantic", "#C8193A", ["LHR"], "G-"],
  ["AF", "Air France", "#1B3A75", ["CDG"], "F-"],
  ["KL", "KLM", "#1CA0DA", ["AMS"], "PH-"],
  ["LH", "Lufthansa", "#2A3D7A", ["FRA", "MUC"], "D-"],
  ["LX", "Swiss", "#D7262C", ["ZRH"], "HB-"],
  ["IB", "Iberia", "#D22630", ["MAD"], "EC-"],
  ["VY", "Vueling", "#C9A400", ["BCN"], "EC-"],
  ["TP", "TAP Air Portugal", "#2A9D5C", ["LIS"], "CS-"],
  ["AZ", "ITA Airways", "#1E64B4", ["FCO"], "EI-"],
  ["TK", "Turkish Airlines", "#C8102E", ["IST"], "TC-"],
  ["MS", "EgyptAir", "#1F3E78", ["CAI"], "SU-"],
  ["SA", "South African Airways", "#2D6CB0", ["JNB"], "ZS-"],
  ["EK", "Emirates", "#C9252C", ["DXB"], "A6-"],
  ["QR", "Qatar Airways", "#7A1E4A", ["DOH"], "A7-"],
  ["AI", "Air India", "#C8382F", ["DEL"], "VT-"],
  ["SQ", "Singapore Airlines", "#D99A2B", ["SIN"], "9V-"],
  ["CX", "Cathay Pacific", "#1E7A6E", ["HKG"], "B-"],
  ["CA", "Air China", "#C8202F", ["PEK"], "B-"],
  ["KE", "Korean Air", "#2C9AD4", ["ICN"], "HL"],
  ["NH", "ANA", "#1F4E99", ["HND", "NRT"], "JA"],
  ["JL", "Japan Airlines", "#C8202F", ["HND", "NRT"], "JA"],
  ["QF", "Qantas", "#D3262C", ["SYD", "MEL"], "VH-"],
  ["NZ", "Air New Zealand", "#4A4F57", ["AKL"], "ZK-"],
];

MA.AIRLINES = {};
MA.AIRLINE_ROWS.forEach(([iata, name, color, hubs, reg]) => {
  MA.AIRLINES[iata] = { iata, name, color, hubs, reg };
});

MA.airline = function (code) {
  return MA.AIRLINES[code] || {
    iata: code,
    name: "Airline " + code,
    color: "#6B7A90",
    hubs: ["JFK", "LHR", "MAD", "MEX", "DXB", "SIN"],
    reg: "N",
  };
};

// Aircraft families by stage length (km).
MA.AIRCRAFT = {
  short: [
    { type: "Airbus A320neo", seats: 180 },
    { type: "Boeing 737 MAX 8", seats: 172 },
    { type: "Airbus A321neo", seats: 196 },
    { type: "Embraer E190-E2", seats: 106 },
  ],
  medium: [
    { type: "Boeing 787-9", seats: 290 },
    { type: "Airbus A330-900", seats: 287 },
    { type: "Airbus A321XLR", seats: 190 },
    { type: "Boeing 767-300ER", seats: 211 },
  ],
  long: [
    { type: "Boeing 777-300ER", seats: 350 },
    { type: "Airbus A350-900", seats: 315 },
    { type: "Airbus A350-1000", seats: 350 },
    { type: "Boeing 787-10", seats: 318 },
  ],
};
