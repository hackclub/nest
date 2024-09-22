import Link from "next/link";
import { forwardRef, Ref } from "react";
import { FaCode } from "react-icons/fa";

const Footer = forwardRef((_: unknown, ref: Ref<HTMLDivElement>) => {
  return (
    <footer ref = {ref} className="relative bg-footer-pattern px-4 py-12 font-dm-mono text-white lg:px-10 lg:py-16">
      <div className="absolute inset-0 opacity-5" />
      <div className="relative z-10 mx-auto w-11/12">
        <div className="flex flex-col items-center justify-between gap-y-8 lg:flex-row lg:items-start">
          <div className="flex flex-col items-center lg:items-start">
            <h2 className="mb-4 text-2xl font-medium lg:text-3xl">
              Ready to get started?
            </h2>
            <Link
              href="https://guides.hackclub.app/index.php/Quickstart"
              className="flex items-center gap-x-2 rounded-lg border-2 border-HCPurple bg-HCPurple px-4 py-2 text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 2xl:text-xl"
            >
              <FaCode className="text-xl" />
              <span>Join Nest!</span>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-y-4 lg:items-end">
            <p className="max-w-md text-center text-base lg:text-right lg:text-lg">
              Nest is a project by{" "}
              <Link
                href="https://hackclub.com"
                className="text-HCRed hover:underline"
              >
                Hack Club
              </Link>
              . All code and configuration is open-source.
            </p>
            <div className="flex gap-x-6">
              <FooterLink
                href="https://github.com/hackclub/nest"
                text="GitHub"
              />
              <span className="text-gray-500">|</span>
              <FooterLink
                href="https://hcb.hackclub.com/nest"
                text="Finances"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

interface FooterLinkProps {
  href: string;
  text: string;
}

function FooterLink({ href, text }: FooterLinkProps) {
  return (
    <Link
      href={href}
      className="text-lg font-medium text-HCPurpleText transition-colors hover:text-white"
    >
      {text}
    </Link>
  );
};

Footer.displayName = 'Footer';
export default Footer;
