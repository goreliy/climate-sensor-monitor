
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

This application consists of a frontend and backend server. The backend server can be run in different modes:

### Running the Server

```sh
# Start server (automatically starts in fallback mode if native modules fail)
node src/server-setup.js
```

### Important Notes for Windows Users

If you're on Windows and have spaces in your path (e.g., "C:\Program Files\..." or folders with spaces), you might encounter issues. In this case:

1. Use the fallback mode which will start automatically
2. Make sure your terminal has the right permissions

### Web Mode (No Native Dependencies)

The application is designed to work in a fully web-compatible mode with an in-memory database. This fallback mode will automatically activate if there are issues with native dependencies.

### Troubleshooting

If you encounter errors when starting the server:

1. Ensure you have installed all the required dependencies:
```sh
npm install express typescript ts-node @types/express @types/cors @types/node
```

2. Try running with the fallback server which doesn't require any native modules:
```sh
node src/server-setup.js
```

3. Check console logs for detailed error messages.

4. If you see errors about file paths with spaces, ensure all commands use proper quoting.

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
