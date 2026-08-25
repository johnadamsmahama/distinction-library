export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-deep px-7 text-center">
      <div>
        <div className="w-14 h-14 mx-auto mb-6 bg-gold rounded-none flex items-center justify-center font-display font-black text-2xl text-navy">
          D
        </div>
        <h1 className="font-display font-bold text-2xl text-white mb-2">You're offline</h1>
        <p className="font-body text-sm text-white/50 max-w-xs mx-auto">
          Check your connection. Any past papers or materials you've already opened are still
          available offline.
        </p>
      </div>
    </div>
  );
}
