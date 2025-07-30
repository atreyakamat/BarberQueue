import { useState, useEffect } from "react";
import { usersAPI } from "../services/api";

export default function ExploreBarbers() {
  const [search, setSearch] = useState("");
  const [filter1, setFilter1] = useState("");
  const [filter2, setFilter2] = useState("");
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    usersAPI.getBarbers({ search, service: filter1, sort: filter2 })
      .then(res => setBarbers(res.data))
      .catch(() => setBarbers([]))
      .finally(() => setLoading(false));
  }, [search, filter1, filter2]);

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
              <a className="text-[#111118] text-sm font-medium leading-normal" href="#">About Us</a>
            </div>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <label className="flex flex-col min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#636388] flex border-none bg-[#f0f0f4] items-center justify-center pl-4 rounded-l-xl border-r-0">
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
            <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Book Now</span>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBo3pfh-ZQMqUh7jdHw1ibemjT6SzvmnpHjQGJ-5rtvFfmbV4YuKb9WNuKOaoV5OdbcVnMHaP-JOBWG8iwa2nwdBZ7pb3_Q8kydsN-5ixHKKMT8gmU-bEV1UrYoOD7BpWNZGP3qEIVzw8XYyKiW8rSQFn8KyImaf0zai7mznLoRf3BxsUqJZ5UEEufhjiUoTBDkosWFa8-gm_wGQNy6en2tbcu3VOI4KcQAyTYOqKtEh3klL6_EzJGKlO3atjkKy2n7KD7UDZloLDTN')"}}></div>
          </div>
        </header>
        {/* Filters */}
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-80">
            <div className="px-4 py-3">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                  <div className="text-[#636388] flex border-none bg-[#f0f0f4] items-center justify-center pl-4 rounded-l-xl border-r-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                    </svg>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111118] focus:outline-0 focus:ring-0 border-none bg-[#f0f0f4] focus:border-none h-full placeholder:text-[#636388] px-4 rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search for barbers"
                  />
                  <div className="flex items-center justify-center rounded-r-xl border-l-0 border-none bg-[#f0f0f4] pr-2 pr-4">
                    <button className="flex max-w-[480px] items-center justify-center rounded-full bg-transparent text-[#111118] gap-2 text-base font-bold leading-normal tracking-[0.015em] h-auto min-w-0 px-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </label>
            </div>
            <h3 className="text-[#111118] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Filters</h3>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <select
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111118] focus:outline-0 focus:ring-0 border border-[#dcdce5] bg-white focus:border-[#dcdce5] h-14 placeholder:text-[#636388] p-[15px] text-base font-normal leading-normal"
                  value={filter1}
                  onChange={e => setFilter1(e.target.value)}
                >
                  <option value="">Select Service</option>
                  <option value="haircut">Haircut</option>
                  <option value="beard">Beard Trim</option>
                  <option value="styling">Styling</option>
                </select>
              </label>
            </div>
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <select
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111118] focus:outline-0 focus:ring-0 border border-[#dcdce5] bg-white focus:border-[#dcdce5] h-14 placeholder:text-[#636388] p-[15px] text-base font-normal leading-normal"
                  value={filter2}
                  onChange={e => setFilter2(e.target.value)}
                >
                  <option value="">Sort By</option>
                  <option value="rating">Rating</option>
                  <option value="distance">Distance</option>
                  <option value="price">Price</option>
                </select>
              </label>
            </div>
            <div className="flex px-4 py-3 justify-end">
              <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-10 px-4 bg-[#1919e5] text-white text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">Apply Filters</span>
              </button>
            </div>
          </div>
          {/* Barbers List */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <h3 className="text-[#111118] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Barbers Near You</h3>
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading barbers...</div>
            ) : barbers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No barbers found.</div>
            ) : (
              barbers.map(barber => (
                <div key={barber._id || barber.name} className="p-4">
                  <div className="flex items-stretch justify-between gap-4 rounded-xl">
                    <div className="flex flex-[2_2_0px] flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <p className="text-[#111118] text-base font-bold leading-tight">{barber.name}</p>
                        <p className="text-[#636388] text-sm font-normal leading-normal">{barber.rating || `${barber.reviews?.average || "N/A"} (${barber.reviews?.count || 0} reviews)`}</p>
                      </div>
                      <button className="flex min-w-[84px] max-w-[480px] items-center justify-center rounded-full h-8 px-4 flex-row-reverse bg-[#f0f0f4] text-[#111118] text-sm font-medium leading-normal w-fit">
                        <span className="truncate">Book</span>
                      </button>
                    </div>
                    <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1" style={{backgroundImage: `url('${barber.image || barber.avatar || "https://via.placeholder.com/300x200?text=Barber"}')`}}></div>
                  </div>
                </div>
              ))
            )}
            {/* Pagination */}
            <div className="flex items-center justify-center p-4">
              <a href="#" className="flex size-10 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                </svg>
              </a>
              <a className="text-sm font-bold leading-normal tracking-[0.015em] flex size-10 items-center justify-center text-[#111118] rounded-full bg-[#f0f0f4]" href="#">1</a>
              <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#111118] rounded-full" href="#">2</a>
              <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#111118] rounded-full" href="#">3</a>
              <span className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#111118] rounded-full" href="#">...</span>
              <a className="text-sm font-normal leading-normal flex size-10 items-center justify-center text-[#111118] rounded-full" href="#">10</a>
              <a href="#" className="flex size-10 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
