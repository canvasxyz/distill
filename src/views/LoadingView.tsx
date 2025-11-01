export function LoadingView() {
  return (
    <div className="fixed inset-0 flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-[#f7fafd]">
      <div className="h-[72px] w-[72px] animate-spin rounded-full border-8 border-[#e0eafd] border-t-[#4b90e2]" />
      <div className="text-2xl font-medium text-[#26426a]">
        Loading, please wait...
      </div>
    </div>
  );
}
