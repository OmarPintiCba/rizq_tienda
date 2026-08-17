import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCarousel } from '../context/CarouselContext';

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { carouselItems } = useCarousel();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);


  return (
    <section className="mt-lg px-margin-desktop">
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-white shadow-level-1 group">
        {carouselItems.length > 0 && (
          <AnimatePresence>
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url("${carouselItems[currentIndex].image}")` }}
            />
          </AnimatePresence>
        )}
        
        {/* Controles del carrusel */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary-container w-6' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Ir a diapositiva ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button 
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </section>
  );
}
