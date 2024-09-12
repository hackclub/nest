import { FaCode } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative bg-footer-pattern px-4 py-12 font-dm-mono text-white lg:px-10 lg:py-16">
      <div className="absolute inset-0 opacity-5"></div>
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-y-8 lg:flex-row lg:items-start lg:gap-y-0">
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="mb-4 text-2xl font-medium lg:text-3xl">Ready to get started?</h2>
            <a
              href="https://guides.hackclub.app/index.php/Quickstart"
              className="flex items-center gap-x-2 border-2 border-HCPurple rounded-lg bg-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:bg-HCPurple 2xl:text-xl hover:scale-105 active:scale-95"
            >
                          <FaCode className="text-xl" />
                          <span>Join Nest!</span>
            </a>
          </div>
          <div className="flex flex-col items-center gap-y-4 lg:items-end">
            <p className="max-w-md text-center text-base lg:text-right lg:text-lg">
              Nest is a project by{" "}
              <a href="https://hackclub.com" className="text-HCRed hover:underline">
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