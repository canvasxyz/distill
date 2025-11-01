export function LoadingView() {
  return (
    <div className="fixed h-screen w-screen flex justify-center items-center bg-[#f7fafd] flex-col gap-6">
      <div className="border-8 border-[#e0eafd] border-t-[#4b90e2] rounded-full w-[72px] h-[72px] animate-spin" />
      <div className="text-[22px] text-[#26426a] font-medium">
        Loading, please wait...
      </div>
    </div>
  );
}
