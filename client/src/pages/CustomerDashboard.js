import { useState, useEffect } from "react";
import { usersAPI } from "../services/api";

const recentActivity = [
  {
    name: "Haircut with Ben",
    shop: "The Sharp Edge",
    time: "2 weeks ago",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAKC5wjNQiCjhhvAIeEo05K8WCPdIVnFa73Q3vppMieNJJS8glHL4LtsD3Pq7JxITvgU_ffcC78-PNIVVxHGxrU0NorOeCAhmdgUYmyIejhIiqNANs_Wtb13SSbL9rwTcueu4YRF5SNtKsT4aYVzLFmjJ7qQtlaQ2jE4HbQdK3GExRsmKQxcaNuSLEZ2TbniQ_J6BqIglGd0mKEQo1Z0ERbPbVUOB9LtgNkGwSl1TMOPLscLytov6Vop8qehuIX8qVcMyAdn0rRZEsT",
  },
  {
    name: "Haircut with Chris",
    shop: "Fade Masters",
    time: "1 month ago",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEqpxhuUJlcVb3zVOPP1pGnw6Tx2wcN9w_yKc03F0T0QaJ0CRLHut8VKvT5-OT15UBpU9nIZx2av4YZhUUygAkX3mOxpP9mm74y_SMiYh4qQD-uXKnyW7NgcqYNPme2QIwXiA0pXgv2ZHs5h2fmTCQPeGZ1soG7zLQSIqFgtwUMPpVu7tAPQSeW_MK2OotZVTJ--ro9XJe1iAvEDsjJ0kxPRUJuv9CGMiYIGA2X_YoAxxx5DAZp2QsneHWfb4nbHoU73zEfNXBGSzL",
  },
];

export default function CustomerDashboard() {
  const [search, setSearch] = useState("");
  const [nearbyBarbers, setNearbyBarbers] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  useEffect(() => {
    setLoadingBarbers(true);
    usersAPI.getBarbers({ search })
      .then(res => setNearbyBarbers(res.data))
      .catch(() => setNearbyBarbers([]))
      .finally(() => setLoadingBarbers(false));
  }, [search]);

  return (
    <div className="relative flex min-h-screen flex-col bg-white overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-b-[#f0f0f4] px-10 py-3">
          <div className="flex items-center gap-8">
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
            <div className="flex items-center gap-9">
              <a className="text-[#111118] text-sm font-medium leading-normal" href="#">Explore</a>
              <a className="text-[#111118] text-sm font-medium leading-normal" href="#">Services</a>
              <a className="text-[#111118] text-sm font-medium leading-normal" href="#">Pricing</a>
            </div>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <label className="flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#636388] flex border-none bg-[#f0f0f4] items-center justify-center pl-4 rounded-l-xl border-r-0">
                  {/* MagnifyingGlass Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                  </svg>
                </div>
                <input
                  placeholder="Search"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111118] focus:outline-0 focus:ring-0 border-none bg-[#f0f0f4] focus:border-none h-full placeholder:text-[#636388] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </label>
            <button className="flex max-w-[480px] items-center justify-center rounded-full h-10 bg-[#f0f0f4] text-[#111118] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
              {/* Bell Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z" />
              </svg>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuABFiC6_VoAwkh07a7Q8WrXcUQ-qyrYXWxYWXIZQSJGL9CDaITDvUNFdSoBRUOM7DsxVFez-x3gGFppnVwUxlP8OOtv7INH6E3BRO4e9QC1R4eSs2wuWM0cfD3Apk9POg7ksiOCvoswmV3nss1hCKaJXKZQNPgMnaIS27A3D7RGLV2_iWDOOpb-NQgDlCeMlQjZw2sv0IIT-CNtjFhe_v2MyI-gb7VLze1rwLlGCqlOgxfwBWFm8t1kExYIttFiJi5-vkC7ZqmUT8s7')"}}></div>
          </div>
        </header>
        {/* Main Content */}
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#111118] text-[32px] font-bold leading-tight min-w-72">Welcome back, Alex</p>
            </div>
            <div className="flex flex-wrap gap-4 p-4">
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dcdce5]">
                <p className="text-[#111118] text-base font-medium leading-normal">Upcoming Appointments</p>
                <p className="text-[#111118] text-2xl font-bold leading-tight">1</p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dcdce5]">
                <p className="text-[#111118] text-base font-medium leading-normal">Total Bookings</p>
                <p className="text-[#111118] text-2xl font-bold leading-tight">12</p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#dcdce5]">
                <p className="text-[#111118] text-base font-medium leading-normal">Favorite Barbers</p>
                <p className="text-[#111118] text-2xl font-bold leading-tight">2</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-col items-stretch justify-start rounded-xl xl:flex-row xl:items-start">
                <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAYkCvTD380QN4cQe_T3iswkB9a-jZVZgciZFFfN-gJYLM4-lKEyl_08232BnyXqs_ytii9yOPn5o_IpKfVjNmnfagKAlC-Robi1upHDdPaZ0XaAP0_wmDHsTwfKMQNmNbzBrK-AWO_RJiE5lZbRUAx7iqq1VMPtwmaqY90MvJXbJfIzdHZ4Tlf0Gg12BGJ-hopqGJJUr0b45NSRIQ_eWFoaztsCF4uzzRrtQVDRzztBiC_5Hkz8655fjV7MqA-mHq1-J8i4Y7xn7Au')"}}></div>
                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-1 py-4 xl:px-4">
                  <p className="text-[#111118] text-lg font-bold leading-tight tracking-[-0.015em]">Next Appointment</p>
                  <div className="flex items-end gap-3 justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-[#636388] text-base font-normal leading-normal">With Ben at The Sharp Edge</p>
                      <p className="text-[#636388] text-base font-normal leading-normal">In 2 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-between">
                <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Book Now</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#f0f0f4] text-[#111118] text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">Join Queue</span>
                </button>
              </div>
            </div>
            <h2 className="text-[#111118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Nearby Barbers</h2>
            <div className="flex overflow-y-auto">
              <div className="flex items-stretch p-4 gap-3">
                {loadingBarbers ? (
                  <div className="text-gray-500 p-4">Loading barbers...</div>
                ) : nearbyBarbers.length === 0 ? (
                  <div className="text-gray-500 p-4">No barbers found.</div>
                ) : (
                  nearbyBarbers.map(barber => (
                    <div key={barber._id || barber.name} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40">
                      <div className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col" style={{backgroundImage: `url('${barber.image || barber.avatar || "https://via.placeholder.com/300x300?text=Barber"}')`}}></div>
                      <div>
                        <p className="text-[#111118] text-base font-medium leading-normal">{barber.name}</p>
                        <p className="text-[#636388] text-sm font-normal leading-normal">{barber.rating || `${barber.reviews?.average || "N/A"} (${barber.reviews?.count || 0} reviews)`}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <h2 className="text-[#111118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Recent Activity</h2>
            {recentActivity.map(activity => (
              <div key={activity.name} className="flex items-center gap-4 bg-white px-4 min-h-[72px] py-2 justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14" style={{backgroundImage: `url('${activity.image}')`}}></div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[#111118] text-base font-medium leading-normal line-clamp-1">{activity.name}</p>
                    <p className="text-[#636388] text-sm font-normal leading-normal line-clamp-2">{activity.shop}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <p className="text-[#636388] text-sm font-normal leading-normal">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
