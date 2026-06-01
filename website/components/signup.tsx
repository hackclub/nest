import Image from "next/image";
import Link from "next/link";

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
        Want to become a <span className="text-HCPurpleText">bird?</span> Head
        over to the dashboard to get started!
      </p>

      <div className="flex justify-center">
        <a
          href="https://dashboard.hackclub.app"
          target="_blank"
          rel="noopener"
          referrerPolicy="origin"
          className="hover:bg-HCPurpleTextHover mb-8 inline-block rounded bg-HCPurpleText px-6 py-3 text-lg font-medium text-white"
        >
          Go to the Dashboard
        </a>
      </div>
    </section>
  );
}
