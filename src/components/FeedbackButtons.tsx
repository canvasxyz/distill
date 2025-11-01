export const FeedbackButtons = () => {
  return (
    <div className="fixed bottom-5 right-6 z-50 flex flex-col gap-2.5">
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSdyfyXW0Kev9USSqr97FuIoZgXCqVebJsE7aj3kBWEw_xahRQ/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-indigo-700 shadow-md shadow-slate-200 transition hover:border-indigo-200 hover:text-indigo-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        title="Send feedback or get info"
      >
        💬
      </a>
    </div>
  );
};
