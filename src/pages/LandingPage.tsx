import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../context/TenantContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { logoUrl, schoolName } = useTenant();

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#ffffff]">
      <header className="flex w-full items-center justify-center border-b border-solid border-[#e5e7eb] bg-[#ffffff] sticky top-0 z-50">
        <div className="container max-w-none flex grow shrink-0 basis-0 items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={schoolName} className="flex h-10 w-10 flex-none items-center justify-center rounded-[6px] object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[6px] bg-[#0ea5e9] text-[#ffffff]">
                <svg
                  className="font-['Inter'] text-[20px] font-[400] leading-[30px] text-[#ffffff]"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 2.18 7 3.12V11c0 4.67-3.13 9.06-7 10.2-3.87-1.14-7-5.53-7-10.2V6.3z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                  <path
                    d="M12 6 8 8v3c0 2.5 1.7 4.8 4 5.5 2.3-.7 4-3 4-5.5V8z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="w-full font-['Inter'] text-[18px] font-[700] leading-[20px] text-[#1f2937]">
                DOTMOND
              </span>
              <span className="w-full font-['Inter'] text-[10px] font-[600] leading-[16px] tracking-wider text-[#0ea5e9]">
                PRIMARY &amp; SECONDARY SCHOOL
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-8 mobile:hidden">
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#374151]">
              About
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#374151]">
              Academics
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#374151]">
              Admissions
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#374151]">
              Contact
            </span>
          </nav>
          <div 
            onClick={() => navigate('/login')}
            className="flex items-center justify-center rounded-[6px] bg-[#0ea5e9] px-5 py-2.5 cursor-pointer hover:bg-[#0284c7] transition-colors"
          >
            <span className="font-['Inter'] text-[14px] font-[600] leading-[21px] text-[#ffffff]">
              Portal Login
            </span>
          </div>
        </div>
      </header>
      <section className="flex w-full items-center justify-center bg-gradient-to-br from-[#E0F2FE] to-[#F3F4F6]">
        <div className="container max-w-none flex grow shrink-0 basis-0 items-center gap-12 py-20 mobile:flex-col mobile:gap-8 mobile:py-12">
          <div className="flex flex-col items-start gap-6 flex-1">
            <div className="flex items-center gap-2 rounded-[9999px] bg-[#bae6fd] px-4 py-1.5">
              <span className="font-['Inter'] text-[12px] font-[600] leading-[18px] text-[#0369a1]">
                ★ Admissions Open for 2025/2026 Session
              </span>
            </div>
            <h1 className="font-['Inter'] text-[52px] font-[800] leading-[58px] text-[#1f2937] mobile:text-[34px] mobile:leading-[40px] mobile:tracking-normal">
              Steady Progress and Brightness Future
            </h1>
            <p className="font-['Inter'] text-[18px] font-[400] leading-[28px] text-[#4b5563] mobile:text-[16px] mobile:leading-[24px] mobile:tracking-normal">
              At Dotmond School, we are committed to providing quality education
              that builds character, fosters creativity, and prepares every
              child for a brighter tomorrow. Join a community where excellence
              is the standard.
            </p>
            <div className="flex items-center gap-4 mobile:w-full mobile:flex-none mobile:flex-col">
              <div 
                onClick={() => navigate('/login')}
                className="flex items-center justify-center rounded-[6px] bg-[#0ea5e9] px-6 py-3 cursor-pointer hover:bg-[#0284c7] transition-colors mobile:w-full mobile:flex-none"
              >
                <span className="font-['Inter'] text-[15px] font-[600] leading-[23px] text-[#ffffff]">
                  Apply for Admission
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-[6px] border border-solid border-[#0ea5e9] px-6 py-3 cursor-pointer hover:bg-[#e0f2fe] transition-colors mobile:w-full mobile:flex-none">
                <span className="font-['Inter'] text-[15px] font-[600] leading-[23px] text-[#0ea5e9]">
                  Schedule a Visit
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center flex-1">
            <img
              className="grow shrink-0 basis-0 rounded-2xl shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] h-[440px] mobile:h-[280px]"
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=80"
              alt="School Campus"
            />
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-[#1f2937]">
        <div className="container max-w-none flex grow shrink-0 basis-0 items-center justify-between py-12 mobile:flex-col mobile:gap-8">
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="font-['Inter'] text-[40px] font-[800] leading-[60px] text-[#ffffff] mobile:text-[32px] mobile:leading-[48px] mobile:tracking-normal">
              15+
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#bae6fd]">
              Years of Excellence
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="font-['Inter'] text-[40px] font-[800] leading-[60px] text-[#ffffff] mobile:text-[32px] mobile:leading-[48px] mobile:tracking-normal">
              2,500+
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#bae6fd]">
              Happy Students
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="font-['Inter'] text-[40px] font-[800] leading-[60px] text-[#ffffff] mobile:text-[32px] mobile:leading-[48px] mobile:tracking-normal">
              120
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#bae6fd]">
              Dedicated Teachers
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <span className="font-['Inter'] text-[40px] font-[800] leading-[60px] text-[#38bdf8] mobile:text-[32px] mobile:leading-[48px] mobile:tracking-normal">
              97%
            </span>
            <span className="font-['Inter'] text-[14px] font-[500] leading-[21px] text-[#bae6fd]">
              Exam Success Rate
            </span>
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-[#ffffff]">
        <div className="container max-w-none flex grow shrink-0 basis-0 flex-col items-center gap-12 py-20 mobile:py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="font-['Inter'] text-[13px] font-[700] leading-[20px] tracking-wide text-[#0ea5e9]">
              WHY CHOOSE DOTMOND
            </span>
            <h2 className="font-['Inter'] text-[36px] font-[800] leading-[54px] text-[#1f2937] mobile:text-[26px] mobile:leading-[39px] mobile:tracking-normal">
              Building Foundations for Lifelong Success
            </h2>
            <p className="font-['Inter'] text-[16px] font-[400] leading-[24px] text-[#4b5563] max-w-[600px]">
              We combine academic rigor with character development, ensuring
              every student is prepared to lead and succeed.
            </p>
          </div>
          <div className="w-full items-start gap-6 grid grid-cols-4 mobile:grid mobile:grid-cols-1">
            <div className="flex flex-col items-start gap-3 self-stretch rounded-xl border border-solid border-[#e5e7eb] bg-[#e0f2fe] px-6 py-6">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[8px] bg-[#0ea5e9] text-[#ffffff]">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#ffffff]"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
              </div>
              <span className="font-['Inter'] text-[18px] font-[700] leading-[27px] text-[#1f2937]">
                Expert Educators
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                Highly qualified and passionate teachers who inspire every
                student to reach their full potential.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 self-stretch rounded-xl border border-solid border-[#e5e7eb] bg-[#f3f4f6] px-6 py-6">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[8px] bg-[#374151] text-[#ffffff]">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#ffffff]"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 3 2 9l10 6 10-6zm0 13.5L4 11v6l8 4.5 8-4.5v-6z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
              </div>
              <span className="font-['Inter'] text-[18px] font-[700] leading-[27px] text-[#1f2937]">
                Modern Facilities
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                State-of-the-art science labs, computer rooms, a well-stocked
                library, and expansive sports grounds.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 self-stretch rounded-xl border border-solid border-[#e5e7eb] bg-[#e0f2fe] px-6 py-6">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[8px] bg-[#0ea5e9] text-[#ffffff]">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#ffffff]"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2 4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-2.62z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
              </div>
              <span className="font-['Inter'] text-[18px] font-[700] leading-[27px] text-[#1f2937]">
                Holistic Development
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                A balanced curriculum covering academics, sports, arts, and
                moral education for the well-rounded child.
              </span>
            </div>
            <div className="flex flex-col items-start gap-3 self-stretch rounded-xl border border-solid border-[#e5e7eb] bg-[#f3f4f6] px-6 py-6">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-[8px] bg-[#374151] text-[#ffffff]">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#ffffff]"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
              </div>
              <span className="font-['Inter'] text-[18px] font-[700] leading-[27px] text-[#1f2937]">
                Safe &amp; Secure Campus
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                Round-the-clock security, CCTV surveillance, and a caring staff
                to ensure every child is safe and happy.
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-[#f9fafb]">
        <div className="container max-w-none flex grow shrink-0 basis-0 flex-col items-center gap-12 py-20 mobile:py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="font-['Inter'] text-[13px] font-[700] leading-[20px] tracking-wide text-[#0ea5e9]">
              OUR PROGRAMS
            </span>
            <h2 className="font-['Inter'] text-[36px] font-[800] leading-[54px] text-[#1f2937] mobile:text-[26px] mobile:leading-[39px] mobile:tracking-normal">
              Academic Programs for Every Stage
            </h2>
          </div>
          <div className="w-full items-start gap-8 grid grid-cols-3 mobile:grid mobile:grid-cols-1">
            <div className="flex flex-col items-start self-stretch overflow-hidden rounded-xl border border-solid border-[#e5e7eb] bg-[#ffffff]">
              <img
                className="h-52 w-full flex-none object-cover"
                src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80"
                alt="Early Years"
              />
              <div className="flex flex-col items-start gap-3 px-6 py-6">
                <span className="font-['Inter'] text-[12px] font-[600] leading-[18px] text-[#0369a1] rounded-full bg-[#E0F2FE] px-3 py-1">
                  Ages 2 - 5
                </span>
                <span className="font-['Inter'] text-[22px] font-[700] leading-[33px] text-[#1f2937]">
                  Nursery &amp; Early Years
                </span>
                <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                  A fun and nurturing environment where young learners explore,
                  play, and build the foundation for lifelong curiosity.
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch overflow-hidden rounded-xl border border-solid border-[#e5e7eb] bg-[#ffffff]">
              <img
                className="h-52 w-full flex-none object-cover"
                src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80"
                alt="Primary School"
              />
              <div className="flex flex-col items-start gap-3 px-6 py-6">
                <span className="font-['Inter'] text-[12px] font-[600] leading-[18px] text-[#374151] rounded-full bg-[#F3F4F6] px-3 py-1">
                  Ages 6 - 11
                </span>
                <span className="font-['Inter'] text-[22px] font-[700] leading-[33px] text-[#1f2937]">
                  Primary School
                </span>
                <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                  Developing strong foundations in literacy, numeracy, science,
                  and critical thinking for confident young minds.
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start self-stretch overflow-hidden rounded-xl border border-solid border-[#e5e7eb] bg-[#ffffff]">
              <img
                className="h-52 w-full flex-none object-cover"
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80"
                alt="Secondary School"
              />
              <div className="flex flex-col items-start gap-3 px-6 py-6">
                <span className="font-['Inter'] text-[12px] font-[600] leading-[18px] text-[#0369a1] rounded-full bg-[#E0F2FE] px-3 py-1">
                  Ages 12 - 17
                </span>
                <span className="font-['Inter'] text-[22px] font-[700] leading-[33px] text-[#1f2937]">
                  Secondary School
                </span>
                <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#4b5563]">
                  Preparing students for WAEC, NECO, and university entrance
                  with academic excellence, discipline, and integrity.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-[#ffffff]">
        <div className="container max-w-none flex grow shrink-0 basis-0 items-center justify-center py-20 mobile:py-12">
          <div className="flex flex-col items-center gap-6 rounded-2xl bg-[#e0f2fe] px-12 py-12 max-w-[820px] text-center mobile:px-6 mobile:py-6">
            <span className="font-['Inter'] text-[48px] font-[800] leading-[40px] text-[#38bdf8]">
              &quot;
            </span>
            <p className="font-['Inter'] text-[22px] font-[500] leading-[34px] text-[#1f2937] mobile:text-[18px] mobile:leading-[28px] mobile:tracking-normal">
              Dotmond School has been a blessing to our family. My children have
              grown in confidence, character, and academic excellence. The
              teachers genuinely care about every student&#39;s progress.
            </p>
            <div className="flex items-center gap-4">
              <img
                className="h-14 w-14 flex-none rounded-[9999px] object-cover"
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80"
                alt="Parent"
              />
              <div className="flex flex-col items-start">
                <span className="font-['Inter'] text-[15px] font-[700] leading-[23px] text-[#1f2937]">
                  Mrs. Funke Adeyemi
                </span>
                <span className="font-['Inter'] text-[13px] font-[400] leading-[20px] text-[#6b7280]">
                  Parent, Ikeja, Lagos
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-gradient-to-r from-[#1F2937] to-[#0EA5E9]">
        <div className="container max-w-none flex grow shrink-0 basis-0 items-center justify-between py-16 gap-8 mobile:flex-col mobile:items-start mobile:justify-start mobile:gap-8 mobile:py-12 mobile:text-left">
          <div className="flex flex-col items-start gap-3">
            <h2 className="font-['Inter'] text-[34px] font-[800] leading-[51px] text-[#ffffff] mobile:text-[26px] mobile:leading-[39px] mobile:tracking-normal">
              Enroll Your Child at Dotmond School
            </h2>
            <p className="font-['Inter'] text-[16px] font-[400] leading-[24px] text-[#bae6fd] max-w-[520px]">
              Admissions for the 2025/2026 academic session are now open. Spaces
              are limited — take the first step toward your child&#39;s brighter
              future today.
            </p>
          </div>
          <div className="flex items-center gap-4 mobile:w-full mobile:flex-none mobile:flex-col">
            <div 
              onClick={() => navigate('/login')}
              className="flex items-center justify-center rounded-[6px] bg-[#38bdf8] px-7 py-3.5 cursor-pointer hover:bg-[#7dd3fc] transition-colors mobile:w-full mobile:flex-none"
            >
              <span className="font-['Inter'] text-[15px] font-[700] leading-[23px] text-[#1f2937]">
                Start Application
              </span>
            </div>
            <div className="flex items-center justify-center rounded-[6px] border border-solid border-[#7dd3fc] px-7 py-3.5 cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors mobile:w-full mobile:flex-none">
              <span className="font-['Inter'] text-[15px] font-[600] leading-[23px] text-[#ffffff]">
                Call Us
              </span>
            </div>
          </div>
        </div>
      </section>
      <footer className="flex w-full items-center justify-center bg-[#111827]">
        <div className="container max-w-none flex grow shrink-0 basis-0 flex-col items-start gap-10 py-16 mobile:py-12">
          <div className="flex w-full items-start justify-between gap-10 mobile:flex-col">
            <div className="flex max-w-[320px] flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={schoolName} className="flex h-10 w-10 flex-none items-center justify-center rounded-[6px] object-cover" />
                ) : (
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[6px] bg-[#0ea5e9] text-[#ffffff]">
                    <svg
                      className="font-['Inter'] text-[20px] font-[400] leading-[30px] text-[#ffffff]"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 2.18 7 3.12V11c0 4.67-3.13 9.06-7 10.2-3.87-1.14-7-5.53-7-10.2V6.3z"
                        fill="currentColor"
                        fillOpacity="1"
                      />
                      <path
                        d="M12 6 8 8v3c0 2.5 1.7 4.8 4 5.5 2.3-.7 4-3 4-5.5V8z"
                        fill="currentColor"
                        fillOpacity="1"
                      />
                    </svg>
                  </div>
                )}
                <span className="font-['Inter'] text-[18px] font-[700] leading-[27px] text-[#ffffff]">
                  Dotmond School
                </span>
              </div>
              <p className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#9ca3af]">
                Steady progress and a brighter future through quality education,
                strong values, and a caring community.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <span className="font-['Inter'] text-[14px] font-[700] leading-[21px] text-[#ffffff]">
                Quick Links
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af] cursor-pointer hover:text-white">
                About Us
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af] cursor-pointer hover:text-white">
                Academics
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af] cursor-pointer hover:text-white">
                Admissions
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af] cursor-pointer hover:text-white">
                Gallery
              </span>
            </div>
            <div className="flex flex-col items-start gap-3">
              <span className="font-['Inter'] text-[14px] font-[700] leading-[21px] text-[#ffffff]">
                Contact Us
              </span>
              <div className="flex items-start gap-2">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#38bdf8] mt-0.5 flex-none"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
                <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#9ca3af]">
                  12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#38bdf8] flex-none"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
                <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af]">
                  +234 812 345 6789
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="font-['Inter'] text-[14px] font-[400] leading-[20px] text-[#38bdf8] flex-none"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4-8 5-8-5V6l8 5 8-5z"
                    fill="currentColor"
                    fillOpacity="1"
                  />
                </svg>
                <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af]">
                  info@dotmondschool.edu.ng
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
              <span className="font-['Inter'] text-[14px] font-[700] leading-[21px] text-[#ffffff]">
                School Hours
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[22px] text-[#9ca3af]">
                Monday - Friday
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af]">
                7:30 AM - 3:30 PM
              </span>
              <span className="font-['Inter'] text-[14px] font-[400] leading-[21px] text-[#9ca3af]">
                After-school clubs until 5:00 PM
              </span>
            </div>
          </div>
          <div className="flex w-full items-center justify-between border-t border-solid border-[#374151] pt-6 mobile:flex-col mobile:gap-3">
            <span className="font-['Inter'] text-[13px] font-[400] leading-[20px] text-[#9ca3af]">
              © 2025 Dotmond Primary &amp; Secondary School. All rights
              reserved.
            </span>
            <span className="font-['Inter'] text-[13px] font-[400] leading-[20px] text-[#9ca3af]">
              Privacy Policy · Terms of Service
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
