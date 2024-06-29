export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-start gap-y-3 font-dm-mono text-white border-t-2 border-violet-500 md:border-transparent">
      <p className="text-4xl font-medium hidden lg:block">Ready to get started?</p>
      <a
        href="https://guides.hackclub.app/index.php/Quickstart"
        className="mt-5 rounded-lg bg-HCPurple px-4 py-3 font-dm-mono text-lg font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:mt-0 md:text-xl lg:text-2xl hidden lg:block"
      >
        Join Nest!
      </a>
      <p className="mb-3 mt-3 lg:mt-10 max-w-5xl text-center text-sm lg:text-xl font-medium">
        Nest is a project by{" "}
        <a href="https://hackclub.com" className="underline">
          Hack Club
        </a>
        . All code and configuration is{" "}
        <a href="https://github.com/hackclub/nest" className="underline">
          open-source on GitHub
        </a>
        , and our finances are{" "}
        <a href="https://hcb.hackclub.com/nest" className="underline">
          available on HCB
        </a>
        .
      </p>
    </footer>
  );
}
