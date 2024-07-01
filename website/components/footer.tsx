export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-start gap-y-3 border-t-2 border-violet-950 px-4 py-2 font-dm-mono text-white lg:px-10 lg:pb-4">
      {/* <p className="lg:text-3xl 2xl:text-4xl font-medium hidden lg:block">Ready to get started?</p>
      <a
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="rounded-lg bg-HCPurple px-4 py-2 2xl:px-2 font-dm-mono text-lg font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:text-lg 2xl:text-xl"
        >
          Join Nest!
        </a> */}
      <p className="maw-w-4xl text-center text-xs font-medium lg:mt-5 lg:px-0 lg:py-0 lg:text-lg 2xl:max-w-5xl 2xl:text-xl">
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
