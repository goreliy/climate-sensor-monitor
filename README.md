
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

This application consists of two parts that need to be run separately:

### 1. Start the Frontend Server

```sh
npm run dev
```

This will start the Vite development server for the frontend application, typically available at http://localhost:8080

### 2. Start the Backend Server

In a separate terminal, run:

```sh
node src/server-setup.js
```

This will compile and start the backend server. The server will be available at http://localhost:3001

### Troubleshooting

If you encounter an error about "ES module scope", make sure you're using the updated server-setup.js file, which uses ES Module syntax.

If you need to run the server directly without the setup script, use one of these commands:

```sh
# Using ts-node (if installed)
npx ts-node --transpile-only src/server/index.ts

# Or compile and run
npx tsc src/server/index.ts --outDir dist --esModuleInterop
node dist/server/index.js
```

## Features

- Real-time sensor data monitoring
- Temperature and humidity visualization
- Alert configuration for threshold values
- Modbus communication support
- System status monitoring

## Usage

1. After starting both servers, navigate to http://localhost:8080 in your browser
2. If the frontend can't connect to the backend, you'll see a notification to start the server
3. Once connected, you can view sensor data, configure settings, and monitor system status

## Troubleshooting

If you experience connection errors:
- Ensure both frontend and backend servers are running
- Check that the backend is running on port 3001
- Look for error messages in both terminal windows
