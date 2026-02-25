import React from 'react';
import { Link } from 'react-router-dom';
import HeroSlider from '../../pages/HeroSlider';
import { FaBagShopping } from "react-icons/fa6";

const Hero = () => {
  return (
    <>
  
 <section className="relative min-h-screen flex items-center bg-gradient-to-br from-[#082723] via-[#0d3b35] to-[#061a17] overflow-hidden px-6 md:px-16 py-16">

      {/* Decorative small dots */}
      {/* <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle,_#d4af37_1px,_transparent_1px)] [background-size:40px_40px]"></div>
      </div> */}

      <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto">

        {/* LEFT CONTENT */}
        <div>
          {/* Badge */}
          <div className="inline-block mb-6">
            <span className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-yellow-400 text-sm">
              New Collection 2026
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight">
            Celebrate Every Day in <br />
            <span className="text-yellow-400">Ethnic Elegance</span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-gray-300 text-lg max-w-xl">
            Shop With Niya brings you a beautiful range of ethnic fashion
            wear — from everyday essentials to festive favourites,
            thoughtfully designed for every woman.
          </p>

          {/* Category Pills */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              "Everyday Wear",
              "Festive Collections",
              "Mom–Daughter Combos",
              "Plus Size Fashion",
            ].map((item, index) => (
              <button
                key={index}
                className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-gray-200 hover:bg-yellow-400 hover:text-black transition duration-300"
              >
                {item}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <button className="mt-10 inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-semibold hover:scale-105 transition duration-300 shadow-lg">
            <FaBagShopping size={20} />
            Shop All Collections
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative flex justify-center">
          <div className="relative rounded-3xl border-4 border-yellow-500 p-2 shadow-2xl">
            <img
              src="/images/slide3.JPG"  // replace with your image
              alt="Ethnic Fashion Model"
              className="rounded-2xl object-cover w-[400px] md:w-[450px] h-[500px]"
            />
          </div>
        </div>
      </div>
    </section>

      <HeroSlider />

    </>
  );
};

export default Hero;
