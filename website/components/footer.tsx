export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-start gap-y-3 font-dm-mono text-white border-t-2 border-violet-700">
      {/* <p className="lg:text-3xl 2xl:text-4xl font-medium hidden lg:block">Ready to get started?</p>
      <a
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="rounded-lg bg-HCPurple px-4 py-2 2xl:px-2 font-dm-mono text-lg font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:text-lg 2xl:text-xl"
        >
          Join Nest!
        </a> */}
      <p className="px-4 py-3 lg:py-0 lg:px-0 lg:mt-5 maw-w-4xl 2xl:max-w-5xl text-center text-sm lg:text-lg 2xl:text-xl font-medium">
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
