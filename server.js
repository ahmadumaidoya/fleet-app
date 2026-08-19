const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));

const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI;

if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));
}

const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  route: { type: String, default: 'Interstate Hub' },
  mileage: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

app.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    
    const total = vehicles.length;
    const active = vehicles.filter(v => v.status === 'Active').length;
    const maintenance = vehicles.filter(v => v.status === 'In Maintenance').length;
    const transit = vehicles.filter(v => v.status === 'In Transit').length;

    let vehicleListHtml = vehicles.map(v => `
      <tr class="hover:bg-slate-800/60 transition-colors duration-150 border-b border-slate-800/80">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-lg shadow-inner">
              🚚
            </div>
            <div>
              <span class="font-bold text-white tracking-wide">${v.plateNumber}</span>
              <span class="block text-[11px] text-slate-400 font-mono">ASSET-${v._id.toString().slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">${v.driverName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
          <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            📍 ${v.route}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">${v.mileage ? v.mileage.toLocaleString() + ' km' : '0 km'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
            v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
            v.status === 'In Transit' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }">
            <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${
              v.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 
              v.status === 'In Transit' ? 'bg-blue-400 animate-pulse' : 'bg-amber-400'
            }"></span>
            ${v.status}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">${new Date(v.createdAt).toLocaleDateString()}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
          <a href="/delete/${v._id}" class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-150 shadow-sm">
            Retire Asset
          </a>
        </td>
      </tr>
    `).join('');

    if (vehicles.length === 0) {
      vehicleListHtml = `
        <tr>
          <td colspan="7" class="px-6 py-16 text-center text-slate-500 text-sm">
            <div class="flex flex-col items-center justify-center space-y-2">
              <span class="text-3xl">🛰️</span>
              <p>No active transport assets detected in telemetry matrix.</p>
            </div>
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
          <title>FleetCommand Enterprise TMS</title>
          <link rel="icon" href="https://emojicdn.elk.sh/🚚">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
              body { font-family: 'Plus Jakarta Sans', sans-serif; }
          </style>
      </head>
      <body class="bg-[#090d16] text-slate-100 antialiased min-h-screen selection:bg-blue-600 selection:text-white">
          
          <!-- Modern Navigation Bar -->
          <header class="bg-[#0e1626]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
              <div class="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                  <div class="flex items-center space-x-4">
                      <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 border border-blue-400/30">
                          🚚
                      </div>
                      <div>
                          <div class="flex items-center space-x-2">
                              <span class="font-extrabold text-lg tracking-tight text-white">FLEETCOMMAND</span>
                              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Enterprise TMS</span>
                          </div>
                          <p class="text-xs text-slate-400">Global Telematics, Route Intelligence & Asset Control</p>
                      </div>
                  </div>
                  <div class="flex items-center space-x-3">
                      <div class="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-300 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
                          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>Telemetry Core: <strong class="text-emerald-400 font-semibold">Online</strong></span>
                      </div>
                  </div>
              </div>
          </header>

          <main class="max-w-7xl mx-auto px-6 py-10 space-y-8">
              
              <!-- Metrics Cards Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div class="bg-gradient-to-b from-[#111c30] to-[#0d1322] p-6 rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden group hover:border-slate-700 transition">
                      <div class="absolute -right-4 -bottom-4 text-slate-800/40 text-6xl group-hover:scale-110 transition duration-300 select-none">📊</div>
                      <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fleet Assets</p>
                      <p class="text-4xl font-black text-white mt-2 tracking-tight">${total}</p>
                      <div class="mt-3 text-[11px] text-slate-400 flex items-center">
                          <span class="text-blue-400 font-semibold mr-1">100%</span> Synced with cluster
                      </div>
                  </div>

                  <div class="bg-gradient-to-b from-[#111c30] to-[#0d1322] p-6 rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/30 transition">
                      <div class="absolute -right-4 -bottom-4 text-emerald-900/20 text-6xl group-hover:scale-110 transition duration-300 select-none">🟢</div>
                      <p class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Units</p>
                      <p class="text-4xl font-black text-emerald-400 mt-2 tracking-tight">${active}</p>
                      <div class="mt-3 text-[11px] text-slate-400 flex items-center">
                          <span class="text-emerald-400 font-semibold mr-1">Ready</span> for immediate dispatch
                      </div>
                  </div>

                  <div class="bg-gradient-to-b from-[#111c30] to-[#0d1322] p-6 rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden group hover:border-blue-500/30 transition">
                      <div class="absolute -right-4 -bottom-4 text-blue-900/20 text-6xl group-hover:scale-110 transition duration-300 select-none">🛣️</div>
                      <p class="text-xs font-bold text-blue-400 uppercase tracking-wider">In Transit</p>
                      <p class="text-4xl font-black text-blue-400 mt-2 tracking-tight">${transit}</p>
                      <div class="mt-3 text-[11px] text-slate-400 flex items-center">
                          <span class="text-blue-400 font-semibold mr-1">Active</span> corridor routing
                      </div>
                  </div>

                  <div class="bg-gradient-to-b from-[#111c30] to-[#0d1322] p-6 rounded-2xl shadow-xl border border-slate-800/80 relative overflow-hidden group hover:border-amber-500/30 transition">
                      <div class="absolute -right-4 -bottom-4 text-amber-900/20 text-6xl group-hover:scale-110 transition duration-300 select-none">🔧</div>
                      <p class="text-xs font-bold text-amber-400 uppercase tracking-wider">In Maintenance</p>
                      <p class="text-4xl font-black text-amber-400 mt-2 tracking-tight">${maintenance}</p>
                      <div class="mt-3 text-[11px] text-slate-400 flex items-center">
                          <span class="text-amber-400 font-semibold mr-1">Scheduled</span> workshop service
                      </div>
                  </div>
              </div>

              <!-- Data Table Section -->
              <div class="bg-[#0e1626] rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                  <div class="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-[#111c30]/50">
                      <div>
                          <h3 class="font-bold text-base text-white flex items-center">
                              <span class="mr-2">📋</span> Active Fleet Roster & Live Telemetry
                          </h3>
                          <p class="text-xs text-slate-400 mt-0.5">Real-time database stream connected to MongoDB enterprise engine</p>
                      </div>
                  </div>
                  <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-slate-800">
                          <thead class="bg-[#090d16]/80">
                              <tr>
                                  <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Asset / Plate</th>
                                  <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Driver</th>
                                  <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Route / Hub</th>
                                  <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Odometer</th>
                                  <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Status</th>
                                  <th class="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Logged Date</th>
                                  <th class="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-800/60 bg-[#0e1626]">
                              ${vehicleListHtml}
                          </tbody>
                      </table>
                  </div>
              </div>

              <!-- Registration & Dispatch Panel -->
              <div class="bg-gradient-to-b from-[#111c30] to-[#0e1626] p-8 rounded-2xl shadow-2xl border border-slate-800">
                  <h2 class="text-base font-bold text-white mb-6 flex items-center border-b border-slate-800 pb-4">
                      <span class="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mr-3 text-sm">➕</span> 
                      Register / Dispatch New Fleet Asset
                  </h2>
                  <form action="/add" method="POST" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
                      <div>
                          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Plate Number</label>
                          <input type="text" name="plateNumber" placeholder="e.g., ABJ-402-XX" required class="w-full px-4 py-3 text-sm bg-[#090d16] border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                      </div>
                      <div>
                          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Driver Name</label>
                          <input type="text" name="driverName" placeholder="e.g., John Doe" required class="w-full px-4 py-3 text-sm bg-[#090d16] border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                      </div>
                      <div>
                          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Route / Hub</label>
                          <input type="text" name="route" placeholder="e.g., Lagos - Kano" class="w-full px-4 py-3 text-sm bg-[#090d16] border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                      </div>
                      <div>
                          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Mileage (km)</label>
                          <input type="number" name="mileage" placeholder="e.g., 54000" class="w-full px-4 py-3 text-sm bg-[#090d16] border border-slate-700/80 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
                      </div>
                      <div>
                          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Status</label>
                          <select name="status" class="w-full px-4 py-3 text-sm bg-[#090d16] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer">
                              <option value="Active">Active</option>
                              <option value="In Transit">In Transit</option>
                              <option value="In Maintenance">In Maintenance</option>
                          </select>
                      </div>
                      <div class="lg:col-span-5 pt-3">
                          <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-lg shadow-blue-600/25 transition-all duration-150 border border-blue-400/20 flex items-center justify-center space-x-2">
                              <span>🚀</span>
                              <span>Commit Asset to Fleet Database</span>
                          </button>
                      </div>
                  </form>
              </div>

          </main>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

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