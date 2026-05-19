import { useState, useEffect } from 'react';

export interface Province {
  code: number;
  name: string;
}

export interface District {
  code: number;
  name: string;
  province_code: number;
}

export function useLocations(provinceName?: string) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  // Fetch provinces on initial load
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error fetching provinces:", err));
  }, []);

  // Fetch districts when a province name is provided
  useEffect(() => {
    if (provinceName && provinces.length > 0) {
      const province = provinces.find((p) => p.name === provinceName);
      if (province) {
        fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`)
          .then((res) => res.json())
          .then((data) => setDistricts(data.districts || []))
          .catch((err) => console.error("Error fetching districts:", err));
      } else {
        setDistricts([]);
      }
    } else {
      setDistricts([]);
    }
  }, [provinceName, provinces]);

  return { provinces, districts };
}
