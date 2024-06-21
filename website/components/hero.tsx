export default function Hero() {
  return (
    <section className="grid grid-cols-3 p-32">
      <div className="text-white font-dm-mono flex flex-col justify-start items-start gap-y-5">
        <p className="text-4xl font-medium">
          <span className="text-HCPurple">Nest</span>, a free Linux server from{" "}
          <a href="https://hackclub.com" className="text-HCRed underline">
            Hack Club
          </a>
        </p>
        <p className="text-xl">
          Host Discord bots, apps, websites, try out basic computer networking,
          chat with others and more!
        </p>
        <div className="flex justify-start items-center gap-x-5">
          <a
            href="https://guides.hackclub.app/index.php/Quickstart"
            className="bg-HCPurple py-1.5 px-2 rounded-lg text-base md:text-lg lg:text-xl font-dm-mono font-medium text-white ml-auto mt-4 md:mt-0 hover:bg-HCBlue hover:shadow-lg transition-all duration-300 hover:scale-110"
          >
            Join Nest!
          </a>

          <a
            href="https://guides.hackclub.app/index.php/Main_Page"
            className="border-2 rounded-lg border-HCPurple font-dm-mono font-medium text-HCPurple py-1.5 px-2 text-base md:text-lg lg:text-xl hover:bg-HCPurple hover:text-white transition-all hover:scale-110 duration-300 mt-4 md:mt-0"
          >
            Read the Docs -&gt;
          </a>
        </div>
      </div>
    </section>
  );
}
