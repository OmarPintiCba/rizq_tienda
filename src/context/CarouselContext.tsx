import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CarouselItem } from '../types';
const initialCarousel: CarouselItem[] = [
  {
    id: '1',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASPNRXHA3g23RxNmSdqCQ_Rr1J812ditxbnNBCCN1Vtm3UcO9K2ZqDfXAbGrp5fYezhKhaEH4y4ItUtD9ZgdWS2wb8lELz0evCRNa9BJ8CrpMxBMjuwDHpFdhI2tI3-tOwfExu3aCXOQ9Jlxg53pgMNkYMa7icEDwhRP5mpkZulEHZeRu7Z7KQdcB63xPXOpricQ2sDbQLPqTEHpZwwqiMX0Vxa7Yb8nh5o9fPRK7o6rHuXgNXwUhc9qSqwA2yDCPTN4_9ZtdAEX4',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop',
  }
];

interface CarouselContextType {
  carouselItems: CarouselItem[];
  updateCarouselItem: (id: string, item: Partial<CarouselItem>) => void;
}

const CarouselContext = createContext<CarouselContextType | undefined>(undefined);

export const CarouselProvider = ({ children }: { children: ReactNode }) => {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(initialCarousel);

  const updateCarouselItem = (id: string, updatedItem: Partial<CarouselItem>) => {
    setCarouselItems((prev) => 
      prev.map((p) => (p.id === id ? { ...p, ...updatedItem } : p))
    );
  };

  return (
    <CarouselContext.Provider value={{ carouselItems, updateCarouselItem }}>
      {children}
    </CarouselContext.Provider>
  );
};

export const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (context === undefined) {
    throw new Error('useCarousel must be used within a CarouselProvider');
  }
  return context;
};
