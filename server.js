const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. Connect to MongoDB using Railway's environment variable
const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/fleetlocal';

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// 2. Define a Simple Fleet Vehicle Schema
const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// 3. Simple Web Interface (HTML Route)
app.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fleet Reporting App</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f4f4f9; color: #333; }
          .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          input, select { width: 100%; padding: 8px; margin: 8px 0 16px 0; display: inline-block; border: 1px solid #ccc; box-sizing: border-box; border-radius: 4px; }
          button { background-color: #0070f3; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
          button:hover { background-color: #0051a2; }
          ul { list-style-type: none; padding: 0; }
          li { background: #fafafa; margin-bottom: 10px; padding: 10px; border-left: 4px solid #0070f3; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Fleet Status Dashboard</h2>
          <form action="/add-vehicle" method="POST">
            <label>Vehicle Number / Plate:</label>
            <input type="text" name="vehicleNumber" placeholder="e.g., ABJ-402-XX" required>
            
            <label>Driver Name:</label>
            <input type="text" name="driverName" placeholder="e.g., John Doe" required>
            
            <label>Status:</label>
            <select name="status">
              <option value="Active">Active</option>
              <option value="In Maintenance">In Maintenance</option>
              <option value="Out of Service">Out of Service</option>
            </select>
            
            <button type="submit">Register Vehicle</button>
          </form>

          <h3>Active Fleet Reports</h3>
          <ul>
    `;

    if (vehicles.length === 0) {
      html += `<li>No vehicles registered yet.</li>`;
    } else {
      vehicles.forEach(v => {
        html += `<li><strong>${v.vehicleNumber}</strong> - Driver: ${v.driverName} <br><small>Status: ${v.status} | Added: ${v.createdAt.toDateString()}</small></li>`;
      });
    }

    html += `
          </ul>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send("Error loading fleet data: " + err.message);
  }
});

// 4. Handle Form Submission Route
app.post('/add-vehicle', async (req, res) => {
  try {
    await Vehicle.create({
      vehicleNumber: req.body.vehicleNumber,
      driverName: req.body.driverName,
      status: req.body.status
    });
    res.redirect('/');
  } catch (err) {
    res.status(400).send("Error saving vehicle: " + err.message);
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});