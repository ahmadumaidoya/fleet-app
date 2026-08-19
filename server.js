const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB using Railway's environment variable
const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI;

if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Define Fleet Schema with Mileage and Status
const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  mileage: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Main Dashboard Route (Displays stats, form, and vehicle list)
app.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    
    // Calculate simple metrics
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'Active').length;
    const maintenance = vehicles.filter(v => v.status === 'In Maintenance').length;

    let vehicleListHtml = vehicles.map(v => `
      <div style="background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 5px solid ${v.status === 'Active' ? '#10b981' : '#f59e0b'}; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="text-align: left;">
          <strong style="font-size: 16px; color: #1e293b;">${v.plateNumber}</strong> - <span style="color: #64748b;">Driver: ${v.driverName}</span><br>
          <small style="color: #64748b;">Status: <b>${v.status}</b> | Mileage: ${v.mileage ? v.mileage.toLocaleString() + ' km' : 'N/A'} | Added: ${new Date(v.createdAt).toLocaleDateString()}</small>
        </div>
        <div>
          <a href="/delete/${v._id}" style="background: #ef4444; color: white; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-size: 12px;">Delete</a>
        </div>
      </div>
    `).join('');

    if (vehicles.length === 0) {
      vehicleListHtml = '<p style="color: #64748b; text-align: center;">No vehicles registered yet.</p>';
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fleet Status Dashboard</title>
          <link rel="icon" href="https://emojicdn.elk.sh/🚚">
          <style>
              body { font-family: Arial, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 30px; }
              .container { max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              h1 { color: #1e293b; text-align: center; margin-top: 0; }
              .stats { display: flex; justify-content: space-around; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 6px; }
              .stat-box { text-align: center; }
              .stat-box span { display: block; font-size: 20px; font-weight: bold; color: #0284c7; }
              label { display: block; margin-top: 10px; font-weight: bold; color: #475569; text-align: left; }
              input, select { width: 100%; padding: 10px; margin-top: 5px; margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; }
              button { width: 100%; background: #0284c7; color: white; border: none; padding: 12px; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: bold; }
              button:hover { background: #0369a1; }
              hr { border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🚚 Fleet Status Dashboard</h1>
              
              <!-- Quick Stats Bar -->
              <div class="stats">
                  <div class="stat-box">Total Vehicles <span>${total}</span></div>
                  <div class="stat-box" style="color: #10b981;">Active <span>${active}</span></div>
                  <div class="stat-box" style="color: #f59e0b;">Maintenance <span>${maintenance}</span></div>
              </div>

              <!-- Registration Form -->
              <form action="/add" method="POST">
                  <label>Vehicle Number / Plate:</label>
                  <input type="text" name="plateNumber" placeholder="e.g., ABJ-402-XX" required>
                  
                  <label>Driver Name:</label>
                  <input type="text" name="driverName" placeholder="e.g., John Doe" required>

                  <label>Current Mileage (km):</label>
                  <input type="number" name="mileage" placeholder="e.g., 45000">

                  <label>Status:</label>
                  <select name="status">
                      <option value="Active">Active</option>
                      <option value="In Maintenance">In Maintenance</option>
                  </select>

                  <button type="submit">Register Vehicle</button>
              </form>

              <hr>

              <h3 style="text-align: left; color: #1e293b;">Active Fleet Reports</h3>
              <div>${vehicleListHtml}</div>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

// Route to Handle Adding a Vehicle
app.post('/add', async (req, res) => {
  try {
    const { plateNumber, driverName, mileage, status } = req.body;
    await Vehicle.create({
      plateNumber,
      driverName,
      mileage: mileage ? Number(mileage) : 0,
      status
    });
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error saving vehicle: ' + err.message);
  }
});

// Route to Handle Deleting a Vehicle
app.get('/delete/:id', async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting vehicle: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});