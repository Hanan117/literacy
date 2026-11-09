export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-container-lowest border-b border-surface-container-high px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary text-sm">L</div>
            <h1 className="text-lg font-semibold">Literacy Admin</h1>
          </div>
          <span className="text-sm text-on-surface-variant">Admin Panel</span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm">
            <h3 className="text-sm text-on-surface-variant mb-2">Total Buku</h3>
            <p className="text-2xl font-semibold">0</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm">
            <h3 className="text-sm text-on-surface-variant mb-2">Pengguna</h3>
            <p className="text-2xl font-semibold">0</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm">
            <h3 className="text-sm text-on-surface-variant mb-2">Terpublikasi</h3>
            <p className="text-2xl font-semibold">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
