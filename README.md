# 🏥 HealthRoute: Nearest Medical Facility Finder

An interactive web application that implements **Dijkstra's Algorithm** to help people find the nearest essential medical services including hospitals, pharmacies, and veterinary clinics based on their entered location.

## 🚀 Live Demo
[https://satyarao08.github.io/Nearest-Hospital-Finder/]

## 📝 Project Overview
This project was developed to demonstrate a practical, real-world application of graph theory. While Dijkstra's algorithm is often taught in a purely mathematical context, **HealthRoute** applies it to urban navigation and emergency response scenarios.

### How it Works:
1. **User Input:** The user enters their current location (Source Node).
2. **Graph Construction:** The app maps nearby medical facilities as destination nodes.
3. **Weight Calculation:** Edges are weighted based on real-world distance or travel time.
4. **Optimization:** Dijkstra's Algorithm calculates the shortest path from the user to all available facilities.
5. **Result:** The app highlights the nearest facility and provides the most efficient route.

## ✨ Features
* **Multi-Category Search:** Toggle between Hospitals, Medical Stores, and Vet Clinics.
* **Algorithm Visualization:** Visual representation of how the algorithm "scans" nodes to find the optimal path.
* **Responsive UI:** Clean, modern interface designed for both desktop and mobile emergency use.
* **Instant Feedback:** Real-time distance updates as the algorithm processes the graph.

## 🛠️ Tech Stack
* **HTML5:** Semantic structure for the search interface.
* **CSS3:** Custom styling with a focus on accessibility and clear navigation markers.
* **JavaScript (ES6):** Custom implementation of the Dijkstra algorithm logic and DOM manipulation.

## 📂 File Structure
```text
├── index.html       # Main application interface
├── style.css        # UI styling and layout transitions
├── script.js        # Dijkstra's algorithm implementation & logic
└── README.md        # Project documentation
