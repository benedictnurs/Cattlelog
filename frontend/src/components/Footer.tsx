import posthog from "posthog-js";

const Footer = () => {
  return (
    <footer className="bg-[#15374D] text-white flex justify-between items-center px-4 sm:px-[50px] py-[13px]">
      <div className="flex flex-col items-center text-sm 2xl:ml-20 space-y-1 sm:space-y-0">
        <img
          src="/cory-logo.avif"
          alt="Logo"
          className="h-[75px] w-auto block sm:-mb-[5px]"
        />
        <div className="flex items-center">
          <p className="font-bold text-base sm:text-xl flex leading-none items-center bg-gradient-to-r from-white to-[#E4B43D] bg-clip-text text-transparent sm:-mb-[3px]">
            Cattlelog
          </p>
        </div>
        <div className="">
          <a
            href="https://aggieworks.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-xs hover:underline sm:text-base leading-none transition-colors duration-300"
          >
            <p className="text-center whitespace-nowrap">Made by AggieWorks</p>
          </a>
        </div>
      </div>

      <div className="text-sm flex w-full justify-end sm:mr-20 lg:mr-40 ">
        <div className="flex flex-col space-y-1 text-xs sm:text-base">
          <p className="font-bold text-[16px] sm:text-base">Learn More</p>
          <a href="/about" className=" hover:underline text-[14px]">
            About Us
          </a>
          <p className="text-[14px]">Privacy Policy</p>
          <p className="text-[14px]">Terms and Conditions</p>
        </div>

        <div className="flex flex-col-reverse justify-end ml-6 sm:flex-row sm:justify-start sm:ml-0">
          <div className="flex flex-col text-xs sm:text-base pt-8 sm:pt-0 sm:mx-8 lg:mx-16">
            <p className="font-bold text-sm sm:text-base mb-1">Contact</p>
            <a
              href="mailto:aggieworksatucd@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white hover:underline text-[14px]"
            >
              <p>Email</p>
            </a>
          </div>

          <div className="flex flex-col text-xs sm:text-base mb-2 sm:mb-0">
            <p className="font-bold text-[16px] mb-1">Help</p>
            <a
              href="https://airtable.com/appqLRpTDmd1BrR3s/shrHJaUItHhO3Ee27"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline text-[14px]"
              onClick={() => {
                posthog.capture("clicked_feedback");
              }}
            >
              <p>Report a Bug</p>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
