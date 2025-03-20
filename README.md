
# Climate Sensor Monitor

A web-based application for monitoring and managing climate sensors.

## Project Overview

The Climate Sensor Monitor is designed to help track temperature and humidity data from various sensors. It provides a user-friendly interface for monitoring sensor readings, configuring alert thresholds, and visualizing environmental data.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone this repository
2. Install dependencies:
```sh
npm install
```

## Running the Application

This application consists of two parts that can be run together or separately:

### Option 1: Start Both Frontend and Backend (Recommended)

```sh
npm run dev
```

This will start both the Vite development server for the frontend and the backend server.

### Option 2: Start Frontend and Backend Separately

1. Start the Frontend Server:
```sh
npm run dev:frontend
```

2. In a separate terminal, start the Backend Server:
```sh
npm run dev:backend
```

### Web Mode (No Native Dependencies)

If you encounter issues with native dependencies like SQLite, the application will automatically fall back to a web-compatible mode that uses in-memory storage. This is perfect for development and testing.

### Troubleshooting

If you encounter errors when starting the server:

1. Try running with the simplified setup:
```sh
node src/server-setup.js
```

2. If you see errors about missing modules or compilation failures, the system will automatically start a fallback server that works in any environment.

3. For frontend-only development, you can run just the Vite server:
```sh
npm run dev:frontend
```

4. Check the console for any error messages or warnings.

## Features

- Real-time sensor data monitoring
- Temperature and humidity visualization
- Alert configuration for threshold values
- Modbus communication support (web emulation)
- System status monitoring
- Responsive design for desktop and mobile devices

## Usage

1. After starting the application, navigate to http://localhost:8080 in your browser
2. Use the dashboard to view sensor data and system status
3. Configure settings and alerts in the Settings menu
4. View sensor placement on the visualization map

## Development Notes

- The application uses an in-memory database in development mode
- No actual hardware connections are required for testing and development
- All Modbus communication is simulated for development purposes

