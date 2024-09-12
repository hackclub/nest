export default function Footer() {
  return (
    <footer className="border-t-2 border-violet-950 bg-bg px-4 py-8 font-dm-mono text-white lg:px-10 lg:py-12 bg-transparent">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-y-8 lg:flex-row lg:items-start lg:gap-y-0">
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="mb-4 text-2xl font-medium lg:text-3xl">Ready to get started?</h2>
            <a
              href="https://guides.hackclub.app/index.php/Quickstart"
              className="rounded-lg bg-HCPurple px-6 py-2 text-xl font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Join Nest!
            </a>
          </div>
          <div className="flex flex-col items-center gap-y-4 lg:items-end">
            <p className="max-w-md text-center text-base lg:text-right lg:text-lg">
              Nest is a project by{" "}
              <a href="https://hackclub.com" className="text-HCPurpleText hover:underline">
                Hack Club
              </a>
              . All code and configuration is open-source.
            </p>
            <div className="flex gap-x-6">
              <a
                href="https://github.com/hackclub/nest"
                className="text-HCPurpleText hover:text-white transition-colors text-lg font-medium"
              >
                GitHub
              </a>
              <span className="text-gray-500">|</span>
              <a
                href="https://hcb.hackclub.com/nest"
                className="text-HCPurpleText hover:text-white transition-colors text-lg font-medium"
              >
                Finances
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
