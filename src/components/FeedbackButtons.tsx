export const FeedbackButtons = () => {
  return (
    <div className="fixed bottom-[18px] right-6 flex flex-col gap-[10px]">
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-[#f7fafc] rounded py-[7px] px-[10px] no-underline cursor-pointer text-[#345388] font-semibold text-base shadow-[0_1.5px_6px_0px_rgba(120,150,200,0.08)] outline-none border border-gray-300 z-[1000]"
        title="Send feedback or get info"
      >
        💬
      </a>
    </div>
  );
};
