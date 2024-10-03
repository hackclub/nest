import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    title: "Join Hack Club",
    image: "/signup-step1.png",
    description: (
      <>
        Join the{" "}
        <Link
          href="https://hackclub.com/slack/"
          className="text-HCPurpleText hover:underline"
        >
          Hack Club Slack workspace
        </Link>
      </>
    ),
  },
  {
    title: "Register",
    image: "/signup-step2.png",
    description: "Use Quetzal to register for an account",
  },
  {
    title: "Start Nesting",
    image: "/signup-step3.png",
    description: "SSH into your Nest account and start building!",
  },
];

interface StepCardProps {
  step: {
    title: string;
    image: string;
    description: React.ReactNode;
  };
  index: number;
}

const StepCard: React.FC<StepCardProps> = ({ step, index }) => (
  <div className="flex flex-col items-center">
    <div className="mb-2 text-lg font-semibold text-HCPurpleText sm:mb-4 md:text-xl">
      <span className="mr-2 font-mono">{index + 1}.</span>
      {step.title}
    </div>
    <div className="relative mb-3 aspect-[4/3] w-full sm:mb-4">
      <Image
        src={step.image}
        alt={step.title}
        layout="fill"
        objectFit="cover"
      />
    </div>
    <p className="text-center text-sm sm:text-base">{step.description}</p>
  </div>
);

export default function SignupSteps() {
  return (
    <section className="px-4 py-12 lg:px-16 lg:py-24 2xl:px-32 2xl:py-32">
      <h2 className="mb-8 text-center text-3xl font-medium sm:text-3xl md:text-4xl 2xl:text-5xl">
        How to join <span className="text-HCPurpleText">Nest?</span>
      </h2>
      <p className="mb-8 text-center text-lg 2xl:text-xl">
        Want to become a <span className="text-HCPurpleText">bird?</span> Follow
        these steps to get started!
      </p>
      <div className="relative mx-auto mt-14 w-full max-w-6xl rounded-lg bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6 shadow-lg sm:w-11/12 2xl:max-w-7xl">
        <div className="mb-3 flex flex-wrap items-center font-mono text-base text-green-400 sm:mb-6 sm:text-xl">
          <span className="whitespace-nowrap text-blue-400">
            nest@hackclub:~$
          </span>
          <span className="ml-4 whitespace-nowrap">cat signup.txt</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 sm:max-h-[800px]">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
