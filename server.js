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

// Define Fleet Schema
const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  mileage: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Main Dashboard Route
app.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'Active').length;
    const maintenance = vehicles.filter(v => v.status === 'In Maintenance').length;

    let vehicleListHtml = vehicles.map(v => `
      <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center ${v.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
            🚚
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-800 text-base">${v.plateNumber || 'N/A'}</span>
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${v.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">${v.status}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Driver: <span class="font-medium text-slate-700">${v.driverName}</span> &bull; Mileage: <span class="font-medium text-slate-700">${v.mileage ? v.mileage.toLocaleString() + ' km' : '0 km'}</span> &bull; Added: ${new Date(v.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div>
          <a href="/delete/${v._id}" class="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold px-3 py-1.5 rounded-lg transition">Remove</a>
        </div>
      </div>
    `).join('');

    if (vehicles.length === 0) {
      vehicleListHtml = `
        <div class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p class="text-slate-400 text-sm">No vehicles registered in the fleet yet.</p>
        </div>
      `;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fleet Management Dashboard</title>
          <link rel="icon" href="https://emojicdn.elk.sh/🚚">
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen py-10 px-4 sm:px-6">
          <div class="max-w-4xl mx-auto space-y-8">
              
              <!-- Header Section -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div class="flex items-center space-x-3">
                      <div class="p-3 bg-blue-600 text-white text-2xl rounded-xl shadow-md">🚚</div>
                      <div>
                          <h1 class="text-xl font-bold text-slate-800">Fleet Operations Center</h1>
                          <p class="text-xs text-slate-500">Real-time vehicle tracking & management dashboard</p>
                      </div>
                  </div>
              </div>

              <!-- Metrics Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Fleet</p>
                      <p class="text-3xl font-extrabold text-slate-800 mt-1">${total}</p>
                  </div>
                  <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <p class="text-xs font-medium text-emerald-500 uppercase tracking-wider">Active Units</p>
                      <p class="text-3xl font-extrabold text-emerald-600 mt-1">${active}</p>
                  </div>
                  <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <p class="text-xs font-medium text-amber-500 uppercase tracking-wider">In Maintenance</p>
                      <p class="text-3xl font-extrabold text-amber-600 mt-1">${maintenance}</p>
                  </div>
              </div>

              <!-- Main Content Layout -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <!-- Registration Form Column -->
                  <div class="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
                      <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center">
                          <span class="mr-2">➕</span> Register Vehicle
                      </h2>
                      <form action="/add" method="POST" class="space-y-4">
                          <div>
                              <label class="block text-xs font-semibold text-slate-600 mb-1">Plate Number</label>
                              <input type="text" name="plateNumber" placeholder="e.g., ABJ-402-XX" required class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          </div>
                          <div>
                              <label class="block text-xs font-semibold text-slate-600 mb-1">Assigned Driver</label>
                              <input type="text" name="driverName" placeholder="e.g., John Doe" required class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          </div>
                          <div>
                              <label class="block text-xs font-semibold text-slate-600 mb-1">Mileage (km)</label>
                              <input type="number" name="mileage" placeholder="e.g., 45000" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          </div>
                          <div>
                              <label class="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                              <select name="status" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <option value="Active">Active</option>
                                  <option value="In Maintenance">In Maintenance</option>
                              </select>
                          </div>
                          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow-md transition duration-150">
                              Save Vehicle
                          </button>
                      </form>
                  </div>

                  <!-- Fleet List Column -->
                  <div class="lg:col-span-2 space-y-4">
                      <div class="flex items-center justify-between">
                          <h2 class="text-base font-bold text-slate-800">Fleet Inventory</h2>
                          <span class="text-xs text-slate-400">Showing all records</span>
                      </div>
                      <div class="space-y-3">
                          ${vehicleListHtml}
                      </div>
                  </div>

              </div>
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