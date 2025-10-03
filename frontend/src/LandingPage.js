import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const locations = [
    {
      id: 'los-angeles',
      name: 'Los Angeles',
      address: '4424 Melrose Ave, Los Angeles, CA 90004',
      phone: '(555) 123-FLEX',
      image: 'https://static.wixstatic.com/media/ed6e13_8e2c0754480a439a82983733d57002ac~mv2.jpg/v1/fill/w_400,h_250,al_c,q_80,usm_0.66_1.00_0.01/ed6e13_8e2c0754480a439a82983733d57002ac~mv2.jpg'
    },
    {
      id: 'atlanta',
      name: 'Atlanta',
      address: '76 4th St NW, Atlanta, GA 30308',
      phone: '(555) 456-FLEX',
      image: 'https://static.wixstatic.com/media/ed6e13_2d092fb28dfa447bbb43b48244ab02b6~mv2.jpg/v1/fill/w_400,h_250,al_c,q_80,usm_0.66_1.00_0.01/ed6e13_2d092fb28dfa447bbb43b48244ab02b6~mv2.jpg'
    },
    {
      id: 'cleveland',
      name: 'Cleveland', 
      address: '2600 Hamilton Ave, Cleveland, OH 44114',
      phone: '(555) 789-FLEX',
      image: 'https://static.wixstatic.com/media/ed6e13_e804536ff1a343c0836af78e61213ceb~mv2.jpg/v1/fill/w_400,h_250,al_c,q_80,usm_0.66_1.00_0.01/ed6e13_e804536ff1a343c0836af78e61213ceb~mv2.jpg'
    },
    {
      id: 'phoenix',
      name: 'Phoenix',
      address: '1517 S Black Canyon Hwy, Phoenix, AZ 85009',
      phone: '(555) 321-FLEX',
      image: 'https://static.wixstatic.com/media/ed6e13_2fe54746788e4f07b2bca0cffdbd3582~mv2.jpg/v1/fill/w_400,h_250,al_c,q_80,usm_0.66_1.00_0.01/ed6e13_2fe54746788e4f07b2bca0cffdbd3582~mv2.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black">
        <div className="w-full">
          <img 
            src="https://customer-assets.emergentagent.com/job_spatracker-1/artifacts/d6xck9vw_IMG_3413.jpeg"
            alt="FLEXSPAS Header"
            className="w-full h-auto max-h-32 object-contain"
          />
        </div>
        {/* Navigation row */}
        <div className="bg-black px-4 py-2">
          <div className="max-w-7xl mx-auto flex justify-end space-x-4">
            <Link
              to="/admin-login"
              className="text-red-500 hover:text-red-400 px-4 py-2 font-bold text-sm tracking-wide"
            >
              ADMIN LOGIN
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-black sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <svg
              className="hidden lg:block absolute right-0 inset-y-0 h-full w-48 text-black transform translate-x-1/2"
              fill="currentColor"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl leading-tight">
                  <span className="block">FLEX Spa</span>
                  <span className="block text-red-500">Pure Indulgence</span>
                </h1>
                <p className="mt-6 text-base text-gray-300 sm:mt-8 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-8 md:text-xl lg:mx-0">
                  Flex Spas is designed exclusively for men, with locations in Cleveland, Atlanta, Los Angeles, and Phoenix. It's where men escape routine, connect freely and embrace their desires.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a
                      href="#locations"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 md:py-4 md:text-lg md:px-10"
                    >
                      Find Your Location
                    </a>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="#services"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 md:py-4 md:text-lg md:px-10"
                    >
                      Our Services
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://static.wixstatic.com/media/ed6e13_8e2c0754480a439a82983733d57002ac~mv2.jpg/v1/fill/w_800,h_600,al_c,q_85,usm_0.66_1.00_0.01/ed6e13_8e2c0754480a439a82983733d57002ac~mv2.jpg"
            alt="Spa Interior"
          />
        </div>
      </div>

      {/* Locations Section */}
      <div id="locations" className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-red-500 font-semibold tracking-wide uppercase">Our Locations</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Visit us nationwide
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-300 lg:mx-auto">
              Choose your preferred location and experience pure indulgence at any of our premium facilities.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {locations.map((location) => (
                <div key={location.id} className="bg-gray-900 border-2 border-red-500 rounded-lg shadow-xl overflow-hidden min-h-96">
                  <div className="h-48 bg-gray-200">
                    <img
                      className="w-full h-full object-cover"
                      src={location.image}
                      alt={location.name}
                    />
                  </div>
                  <div className="p-6 bg-gray-900">
                    <h3 className="text-xl font-bold text-white mb-3">{location.name}</h3>
                    <p className="text-sm text-gray-300 mb-2">{location.address}</p>
                    <p className="text-sm text-gray-300 mb-4">{location.phone}</p>
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log(`Navigating to /${location.id}`);
                          window.location.assign(`/${location.id}`);
                        }}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 cursor-pointer"
                      >
                        STAFF LOGIN - {location.name.toUpperCase()}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-red-500 font-semibold tracking-wide uppercase">Services</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Premium Amenities
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-300 lg:mx-auto">
              Enjoy our world-class facilities and services designed for your ultimate relaxation.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-lg leading-6 font-medium text-white">Spa Services</dt>
                  <dd className="mt-2 text-base text-gray-300">
                    Relaxing spa treatments in private rooms with premium amenities.
                  </dd>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-lg leading-6 font-medium text-white">Premium Rooms</dt>
                  <dd className="mt-2 text-base text-gray-300">
                    Deluxe rooms with TV, regular rooms, and private lockers.
                  </dd>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-600 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <dt className="text-lg leading-6 font-medium text-white">Membership Plans</dt>
                  <dd className="mt-2 text-base text-gray-300">
                    Flexible daily and monthly membership options to fit your lifestyle.
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-red-500 font-semibold tracking-wide uppercase">About Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Premier Men's Spa & Fitness Experience
            </p>
          </div>

          <div className="mt-10">
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-gray-300 leading-8 text-center">
                Flex Spas is a premier nationwide destination dedicated to providing men with a private, welcoming, and upscale spa and fitness experience. With locations in Cleveland, Atlanta, and Phoenix, Flex Spas combines state-of-the-art gym facilities with luxurious spa amenities, creating the perfect environment for relaxation, wellness, and community. Our commitment is to deliver exceptional service in a safe, professional, and comfortable setting where members can recharge, connect, and prioritize their health and well-being.
              </p>
            </div>

            {/* Key Features */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-600 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">Private & Welcoming</h3>
                <p className="mt-2 text-gray-300">
                  A comfortable, professional environment designed exclusively for men's wellness and relaxation.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-600 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">State-of-the-Art Facilities</h3>
                <p className="mt-2 text-gray-300">
                  Modern gym equipment combined with luxurious spa amenities for the ultimate wellness experience.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-600 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">Safe & Professional</h3>
                <p className="mt-2 text-gray-300">
                  Commitment to exceptional service in a secure environment where you can focus on your health and well-being.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="text-white">
                <h3 className="text-2xl font-black tracking-tight">FLEXSPAS®</h3>
              </div>
              <p className="text-gray-300 text-base">
                Premium spa and wellness facilities across the nation. Your journey to pure indulgence starts here.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-red-500 tracking-wider uppercase">Locations</h3>
                  <ul role="list" className="mt-4 space-y-4">
                    {locations.map((location) => (
                      <li key={location.id}>
                        <Link to={`/${location.id}`} className="text-base text-gray-300 hover:text-red-400">
                          {location.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-red-500 tracking-wider uppercase">Services</h3>
                  <ul role="list" className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-red-400">
                        Spa Services
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-red-400">
                        Premium Rooms
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-red-400">
                        Memberships
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-red-500 tracking-wider uppercase">Company</h3>
                  <ul role="list" className="mt-4 space-y-4">
                    <li>
                      <a href="#about" className="text-base text-red-500 hover:text-red-400">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-red-400">
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2024 FLEXSPAS®. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;