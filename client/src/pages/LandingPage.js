// ...existing code...

// Fonts are loaded via index.html or Tailwind config
// Tailwind CSS should be set up in your project

const featuredBarbers = [
  {
    name: "Ethan Bennett",
    rating: "4.9 (120 reviews)",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWRe4z5fmuFXEgViwv6zlEO9pTFxbwDuIpqSO8VI8gzTc1l7FTw9UKY-em099woggztzWylVyLqDXN6AGe4wk2jCtV9KpO8CYFHbdjVwlYJ1P5aRv6PfDZ__bSAS47KgiSZM4iredCHZJhcSBgpILa6iBhLF_xtcZkUELgg1WZVG-hhTbD_Tmxy37cmtuwTTTKoCce_4WB5AvSETf9kJseBczKyeTg9X-b8bYTPRmjZbeuVkPE5zJGhjkxAUgJNj0yO4D6PgomLnX7",
  },
  {
    name: "Lucas Carter",
    rating: "4.8 (95 reviews)",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1BTK6tjjVxCOOjW3q2AUtoexnw6N-6LE7bPVeE3k5TWNU-KSiFd2iwC5HX1SFMmO95K558nQEy3ujLp6bUnXhHmvXe5V5i3Erb7MWM3zsKttOQ9Eu2Sj-rmkS6YZJHfftHgtdc_RJbXWnwDJ6_h1cWOds0Nu9902YHK1jj_XuAVQ00MUQ0WKGmA7AarZ6HgwlbxpNx2rhyqrAq5c7nl8SXf6f5ialyzMyOcjCIhYeE47oqha5ZgizmvNi75Ky2StlGCO31zUhUw8Y",
  },
  {
    name: "Owen Davis",
    rating: "4.7 (80 reviews)",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4pdx584v6yPGA_MMQpBbF-pDYiiqzw8ESlkG6hbcqst6j8N2PWS27ZL14WUtIJCxC2aXNH8fqmVFCQmAbbFUf19cY1dkiBku0NKE0id4d2ScYAyXh-OL8Yacv9sbW140gk0FYOKtpQ9ETfHTljNgLl564bO7LE3gTIsGlR23VtXaDzxzBi9Sclls6SvJVLB8t7woAXUNpYdcTbesy3qN6HYPqEy8boDJLM9F6qjU7u5FsJP-rb22RqpK6rt_a3HST5vncrE-VfP9W",
  },
];

const testimonials = [
  {
    name: "Liam Harper",
    quote: "I've never had a better haircut. Ethan is a true professional.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD25TrkgtLEdAbszeyrX9nwRSY9Zbj5K3yJ5JhC6OsndZucK07r347kPIms0rTPyBeRBzSZOlq7ZgFavsM8XtE9zfkgNAv_S_g8w54GJuEm3LBm2Y4n_XFCuBZGccqirLb3d_Mx7oFJ8vl5gn0aNJb8DwJ5wdvIAHx2inbGb7mScvANSDHKUh1IDWy2tcOvJ7eG0UyHCKueyVEfVCKxmscQS4CQhad5A-rBBQsfnJzlMKI8i6XAfIbo76dudduabvllgdHlxI1kL6ZK",
  },
  {
    name: "Sophia Evans",
    quote: "The app is so easy to use, and I always find the perfect barber.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFqQZYvuCEGdd6h8MDlHxHGF2SKVmT6Pe1zuv_JFpo7Eni97cdapeCCG43aUZUi7h4df3Ulj0FPuJF-2n7egLv4Cb48lmCLNMEDTenIESOF8c-R35gKEC-MWMsu86BgmkJrKc2esaRDSI-ldV0iAgWijkhDAZYL_CZYGymYlY2BmhRYYSbjYXff3wMUPmrZdEJOGMIm4ikAxA6hUsPqBTrlPZu16rcUAOYoSdqFPJcEA_pzE-gGCLkAQ2Z60qLAAUoT3CqDZT6Q5Od",
  },
  {
    name: "Noah Foster",
    quote: "Clipper has helped me grow my business and connect with more clients.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBW_dmu0tQd3E9B0A7Xehq-6LmNxF2FDLwCWRTJxGNVwtNVE-LXxd_7a0PDx71SEPW8loAJc0dUEizQpmb11csSv6SSV6P-Ca2eg3COxqUIv1m1paTZdQGE2mgsdcWuQE-wc-kQaxFbZL6MF4DGmArJnIl_rR9zAhviNRbKJ6z1QpBlmS1PYrQQJ9qkBCiUMGjmqtmvNNEkUdXZvZOG44PbkFCQBBO0gukHJkxx1RWid2iOpKC_mBWJUBgtv-hDoyppPNaFoaP43dGq",
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-b-[#f0f0f4] px-10 py-3">
          <div className="flex items-center gap-4 text-[#111118]">
            <div className="size-4">
              {/* SVG Logo */}
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_543)">
                  <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M7.24189 26.4066C7.31369 26.4411 7.64204 26.5637 8.52504 26.3738C9.59462 26.1438 11.0343 25.5311 12.7183 24.4963C14.7583 23.2426 17.0256 21.4503 19.238 19.238C21.4503 17.0256 23.2426 14.7583 24.4963 12.7183C25.5311 11.0343 26.1438 9.59463 26.3738 8.52504C26.5637 7.64204 26.4411 7.31369 26.4066 7.24189C26.345 7.21246 26.143 7.14535 25.6664 7.1918C24.9745 7.25925 23.9954 7.5498 22.7699 8.14278C20.3369 9.32007 17.3369 11.4915 14.4142 14.4142C11.4915 17.3369 9.32007 20.3369 8.14278 22.7699C7.5498 23.9954 7.25925 24.9745 7.1918 25.6664C7.14534 26.143 7.21246 26.345 7.24189 26.4066ZM29.9001 10.7285C29.4519 12.0322 28.7617 13.4172 27.9042 14.8126C26.465 17.1544 24.4686 19.6641 22.0664 22.0664C19.6641 24.4686 17.1544 26.465 14.8126 27.9042C13.4172 28.7617 12.0322 29.4519 10.7285 29.9001L21.5754 40.747C21.6001 40.7606 21.8995 40.931 22.8729 40.7217C23.9424 40.4916 25.3821 39.879 27.0661 38.8441C29.1062 37.5904 31.3734 35.7982 33.5858 33.5858C35.7982 31.3734 37.5904 29.1062 38.8441 27.0661C39.879 25.3821 40.4916 23.9425 40.7216 22.8729C40.931 21.8995 40.7606 21.6001 40.747 21.5754L29.9001 10.7285ZM29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1187 3.29028 29.2403 4.41187Z" fill="currentColor" />
                </g>
                <defs>
                  <clipPath id="clip0_6_543"><rect width="48" height="48" fill="white" /></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-[#111118] text-lg font-bold leading-tight tracking-[-0.015em]">Clipper</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-[#111118] text-sm font-medium leading-normal" href="#">Explore</a>
              <a className="text-[#111118] text-sm font-medium leading-normal" href="#">For Barbers</a>
            </div>
            <div className="flex gap-2">
              <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">Sign up</span>
              </button>
              <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#f0f0f4] text-[#111118] text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">Log in</span>
              </button>
            </div>
          </div>
        </header>
        {/* Hero Section */}
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-xl items-center justify-center p-4" style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUBp0WmKfwR8yI8Sl-EDS87Enf9boLjd8f6Y30rMktCaO7kYb4hb5fGMFf7h6BZUCbfMiveFKz67gtwzBDt6YwDMP_aLLqs8t_Z_6gjP7TXeDmqv9oajBFwV4_wurWPtqEAcEVf7IBemA06xZstTwZW0JgDhKJ9enGIJ8x75RE6mgPE48QVgSFfYDrtpa3eUIU0F6AarFS5VKd9UJrGyuCtBe7KIDRtSzmhwPTiVFxgYzi-O-UFbhE6PDTW0j-gL34W-847hIqaGyP')"}}>
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Find your next great haircut</h1>
                <h2 className="text-white text-sm font-normal leading-normal">Discover top-rated barbers in your area, book appointments, and manage your grooming needs all in one place.</h2>
              </div>
              <div className="flex-wrap gap-3 flex justify-center">
                <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Find a barber</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#f0f0f4] text-[#111118] text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Join as a barber</span>
                </button>
              </div>
            </div>
            {/* How it works */}
            <h2 className="text-[#111118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">How it works</h2>
            <div className="flex gap-8 px-4 border-b border-[#dcdce5] pb-3">
              <a className="flex flex-col items-center justify-center border-b-[3px] border-b-[#111118] text-[#111118] pb-[13px] pt-4" href="#">
                <p className="text-[#111118] text-sm font-bold leading-normal tracking-[0.015em]">For customers</p>
              </a>
              <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#636388] pb-[13px] pt-4" href="#">
                <p className="text-[#636388] text-sm font-bold leading-normal tracking-[0.015em]">For barbers</p>
              </a>
            </div>
            <div className="flex flex-col gap-10 px-4 py-10">
              <div className="flex flex-col gap-4">
                <h1 className="text-[#111118] text-[32px] font-bold leading-tight max-w-[720px]">For customers</h1>
                <p className="text-[#111118] text-base font-normal leading-normal max-w-[720px]">Find and book the best barbers in your area with ease.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dcdce5] bg-white p-4 flex-col">
                  <div className="text-[#111118]">
                    {/* MagnifyingGlass Icon */}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111118] text-base font-bold leading-tight">Find a barber</h2>
                    <p className="text-[#636388] text-sm font-normal leading-normal">Search for barbers based on location, services, and reviews.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dcdce5] bg-white p-4 flex-col">
                  <div className="text-[#111118]">
                    {/* Calendar Icon */}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111118] text-base font-bold leading-tight">Book an appointment</h2>
                    <p className="text-[#636388] text-sm font-normal leading-normal">Schedule your haircut at a time that works for you.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dcdce5] bg-white p-4 flex-col">
                  <div className="text-[#111118]">
                    {/* Check Icon */}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111118] text-base font-bold leading-tight">Get a great haircut</h2>
                    <p className="text-[#636388] text-sm font-normal leading-normal">Enjoy a professional grooming experience and leave feeling confident.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* For barbers */}
            <div className="flex gap-8 px-4 border-b border-[#dcdce5] pb-3">
              <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#636388] pb-[13px] pt-4" href="#">
                <p className="text-[#636388] text-sm font-bold leading-normal tracking-[0.015em]">For customers</p>
              </a>
              <a className="flex flex-col items-center justify-center border-b-[3px] border-b-[#111118] text-[#111118] pb-[13px] pt-4" href="#">
                <p className="text-[#111118] text-sm font-bold leading-normal tracking-[0.015em]">For barbers</p>
              </a>
            </div>
            <div className="flex flex-col gap-10 px-4 py-10">
              <div className="flex flex-col gap-4">
                <h1 className="text-[#111118] text-[32px] font-bold leading-tight max-w-[720px]">For barbers</h1>
                <p className="text-[#111118] text-base font-normal leading-normal max-w-[720px]">Manage your schedule, clients, and payments efficiently.</p>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dcdce5] bg-white p-4 flex-col">
                  <div className="text-[#111118]">
                    {/* Users Icon */}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111118] text-base font-bold leading-tight">Manage your clients</h2>
                    <p className="text-[#636388] text-sm font-normal leading-normal">Keep track of your client base and their preferences.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dcdce5] bg-white p-4 flex-col">
                  <div className="text-[#111118]">
                    {/* Calendar Icon */}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111118] text-base font-bold leading-tight">Set your availability</h2>
                    <p className="text-[#636388] text-sm font-normal leading-normal">Control your working hours and avoid scheduling conflicts.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dcdce5] bg-white p-4 flex-col">
                  <div className="text-[#111118]">
                    {/* Money Icon */}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111118] text-base font-bold leading-tight">Get paid on time</h2>
                    <p className="text-[#636388] text-sm font-normal leading-normal">Receive payments securely and promptly for your services.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Featured barbers */}
            <h2 className="text-[#111118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Featured barbers</h2>
            <div className="flex overflow-y-auto">
              <div className="flex items-stretch p-4 gap-3">
                {featuredBarbers.map((barber) => (
                  <div key={barber.name} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                    <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col" style={{backgroundImage: `url('${barber.image}')`}}></div>
                    <div>
                      <p className="text-[#111118] text-base font-medium leading-normal">{barber.name}</p>
                      <p className="text-[#636388] text-sm font-normal leading-normal">{barber.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Testimonials */}
            <h2 className="text-[#111118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Testimonials</h2>
            <div className="flex overflow-y-auto">
              <div className="flex items-stretch p-4 gap-3">
                {testimonials.map((t) => (
                  <div key={t.name} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                    <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col" style={{backgroundImage: `url('${t.image}')`}}></div>
                    <div>
                      <p className="text-[#111118] text-base font-medium leading-normal">{t.name}</p>
                      <p className="text-[#636388] text-sm font-normal leading-normal">"{t.quote}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Download app banner */}
            <div className="flex flex-col justify-end gap-6 px-4 py-10">
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-[#111118] text-[32px] font-bold leading-tight max-w-[720px]">Download the app</h1>
                <p className="text-[#111118] text-base font-normal leading-normal max-w-[720px]">Get the best barbershop experience on the go.</p>
              </div>
              <div className="flex flex-1 justify-center">
                <div className="flex justify-center">
                  <div className="flex flex-1 gap-3 flex-wrap max-w-[480px] justify-center">
                    <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em] grow">
                      <span className="truncate">Download on the App Store</span>
                    </button>
                    <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#f0f0f4] text-[#111118] text-sm font-bold leading-normal tracking-[0.015em] grow">
                      <span className="truncate">Get it on Google Play</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Final CTA */}
            <div className="flex justify-center">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[480px] justify-center">
                <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em] grow">
                  <span className="truncate">Find a barber</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#f0f0f4] text-[#111118] text-sm font-bold leading-normal tracking-[0.015em] grow">
                  <span className="truncate">Join as a barber</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="flex flex-col gap-6 px-5 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <a className="text-[#636388] text-base font-normal leading-normal min-w-40" href="#">About</a>
                <a className="text-[#636388] text-base font-normal leading-normal min-w-40" href="#">Contact</a>
                <a className="text-[#636388] text-base font-normal leading-normal min-w-40" href="#">Privacy Policy</a>
                <a className="text-[#636388] text-base font-normal leading-normal min-w-40" href="#">Terms of Service</a>
              </div>
              <p className="text-[#636388] text-base font-normal leading-normal">@2024 Clipper. All rights reserved.</p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
}
