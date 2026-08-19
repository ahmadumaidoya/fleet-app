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

// Define Enterprise Fleet Schema
const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  route: { type: String, default: 'Interstate Hub' },
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
    const transit = vehicles.filter(v => v.status === 'In Transit').length;

    let vehicleListHtml = vehicles.map(v => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center space-x-3">
            <span class="text-lg">🚚</span>
            <div>
              <span class="font-bold text-slate-900">${v.plateNumber}</span>
              <span class="block text-xs text-slate-500">Added: ${new Date(v.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">${v.driverName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${v.route || 'Hub Direct'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${v.mileage ? v.mileage.toLocaleString() + ' km' : '0 km'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
            v.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 
            v.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
          }">${v.status}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <a href="/delete/${v._id}" class="text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg text-xs transition">Retire Asset</a>
        </td>
      </tr>
    `).join('');

    if (vehicles.length === 0) {
      vehicleListHtml = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center text-slate-400 text-sm">
            No active transport assets registered in the system.
          </td>
        </tr>
      `;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Enterprise Fleet Command Center</title>
          <link rel="icon" href="https://emojicdn.elk.sh/🚚">
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-100 text-slate-900 font-sans antialiased min-h-screen">
          
          <!-- Top Navigation Bar -->
          <header class="bg-slate-900 text-white shadow-md">
              <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                  <div class="flex items-center space-x-3">
                      <div class="bg-blue-600 p-2 rounded-lg text-xl">🚚</div>
                      <div>
                          <h1 class="font-bold text-lg tracking-wide">FLEETCOMMAND <span class="text-blue-400 text-xs font-normal px-2 py-0.5 bg-blue-950 rounded-full border border-blue-800">TMS Enterprise</span></h1>
                          <p class="text-xs text-slate-400">Real-Time Telematics & Asset Control</p>
                      </div>
                  </div>
                  <div class="text-xs text-slate-300 hidden sm:block">
                      System Status: <span class="text-emerald-400 font-bold">&#9679; Operational</span>
                  </div>
              </div>
          </header>

          <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
              
              <!-- Metrics Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fleet Assets</p>
                      <p class="text-3xl font-extrabold text-slate-900 mt-1">${total}</p>
                  </div>
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Units</p>
                      <p class="text-3xl font-extrabold text-emerald-600 mt-1">${active}</p>
                  </div>
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <p class="text-xs font-semibold text-blue-600 uppercase tracking-wider">In Transit</p>
                      <p class="text-3xl font-extrabold text-blue-600 mt-1">${transit}</p>
                  </div>
                  <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                      <p class="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Maintenance</p>
                      <p class="text-3xl font-extrabold text-amber-600 mt-1">${maintenance}</p>
                  </div>
              </div>

              <!-- Main Dashboard Area -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  <!-- Left Form: Dispatch & Registration -->
                  <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                      <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center border-b pb-3">
                          <span class="mr-2">➕</span> Register / Dispatch Asset
                      </h2>
                      <form action="/add" method="POST" class="space-y-4">
                          <div>
                              <label class="block text-xs font-bold text-slate-600 mb-1">Vehicle Plate Number</label>
                              <input type="text" name="plateNumber" placeholder="e.g., ABJ-402-XX" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          </div>
                          <div>
                              <label class="block text-xs font-bold text-slate-600 mb-1">Assigned Driver</label>
                              <input type="text" name="driverName" placeholder="e.g., John Doe" required class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          </div>
                          <div>
                              <label class="block text-xs font-bold text-slate-600 mb-1">Assigned Route / Hub</label>
                              <input type="text" name="route" placeholder="e.g., Lagos - Kano Corridor" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          </div>
                          <div>
                              <label class="block text-xs font-bold text-slate-600 mb-1">Odometer Mileage (km)</label>
                              <input type="number" name="mileage" placeholder="e.g., 54000" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          </div>
                          <div>
                              <label class="block text-xs font-bold text-slate-600 mb-1">Operational Status</label>
                              <select name="status" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600">
                                  <option value="Active">Active</option>
                                  <option value="In Transit">In Transit</option>
                                  <option value="In Maintenance">In Maintenance</option>
                              </select>
                          </div>
                          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow transition duration-150">
                              Commit Asset to Fleet
                          </button>
                      </form>
                  </div>

                  <!-- Right Table: Advanced Fleet Inventory Grid -->
                  <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h3 class="font-bold text-slate-800">Active Fleet Roster & Telematics</h3>
                          <span class="text-xs text-slate-500">Live Database Sync</span>
                      </div>
                      <div class="overflow-x-auto">
                          <table class="min-w-full divide-y divide-slate-200">
                              <thead class="bg-slate-50">
                                  <tr>
                                      <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Asset / Plate</th>
                                      <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                                      <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
                                      <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mileage</th>
                                      <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                      <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                              </thead>
                              <tbody class="bg-white divide-y divide-slate-200">
                                  ${vehicleListHtml}
                              </tbody>
                          </table>
                      </div>
                  </div>

              </div>
          </main>
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
    const { plateNumber, driverName, route, mileage, status } = req.body;
    await Vehicle.create({
      plateNumber,
      driverName,
      route: route || 'Hub Direct',
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