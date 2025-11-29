export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-slate-900">Riff</h1>
        <p className="text-xl text-slate-600 max-w-md">
          A private essay-sharing platform for creative minds
        </p>
        <div className="pt-4">
          <button className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
