import { useState, useEffect, useMemo } from 'react';

export interface Province {
  code: number;
  name: string;
  originalName?: string;
  aliases?: string[];
}

export interface District {
  code: number;
  name: string;
  province_code: number;
}

/**
 * Mapping tỉnh/thành sau sáp nhập
 * Có thể mở rộng thêm sau này
 */
const provinceConfig: Record<
  string,
  {
    displayName: string;
    aliases: string[];
  }
> = {
  // Thêm cấu hình cho Hà Nội ở đây
  'Thành phố Hà Nội': {
    displayName: 'Hà Nội',
    aliases: [
      'Thành phố Hà Nội',
      'Ha Noi',
      'HN',
      'Thủ đô Hà Nội',
    ],
  },
  'Thành phố Hồ Chí Minh': {
    displayName: 'Hồ Chí Minh',
    aliases: [
      'Thành phố Hồ Chí Minh',
      'Ho Chi Minh',
      'HCM',
    ],
  },

  'Bình Dương': {
    displayName: 'Thành phố Hồ Chí Minh',
    aliases: [
      'Bình Dương',
      'Binh Duong',
      'BD',
      'Thu Dau Mot',
    ],
  },

  'Bà Rịa - Vũng Tàu': {
    displayName: 'Thành phố Hồ Chí Minh',
    aliases: [
      'Bà Rịa - Vũng Tàu',
      'Ba Ria Vung Tau',
      'Vũng Tàu',
      'Vung Tau',
      'BRVT',
    ],
  },
};

/**
 * Normalize province
 */
const normalizeProvince = (province: Province): Province => {
  const config = provinceConfig[province.name];

  if (!config) {
    return {
      ...province,
      originalName: province.name,
      aliases: [province.name],
    };
  }

  return {
    ...province,
    originalName: province.name,
    name: config.displayName,
    aliases: config.aliases,
  };
};

export function useLocations(provinceName?: string) {
  const [rawProvinces, setRawProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  /**
   * Fetch provinces
   */
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then((res) => res.json())
      .then((data: Province[]) => {
        const normalized = data.map(normalizeProvince);

        setRawProvinces(normalized);
      })
      .catch((err) => {
        console.error('Error fetching provinces:', err);
      });
  }, []);

  /**
   * Remove duplicate display names
   * Vì Bình Dương + BRVT đều thành TP.HCM
   */
  const provinces = useMemo(() => {
    const map = new Map<string, Province>();

    rawProvinces.forEach((p) => {
      if (!map.has(p.name)) {
        map.set(p.name, p);
      }
    });

    return Array.from(map.values());
  }, [rawProvinces]);

  /**
   * Find province by:
   * - display name
   * - original name
   * - alias
   */
  const findProvince = (keyword: string) => {
    return rawProvinces.find((p) => {
      const lowerKeyword = keyword.toLowerCase();

      return (
        p.name.toLowerCase() === lowerKeyword ||
        p.originalName?.toLowerCase() === lowerKeyword ||
        p.aliases?.some((a) =>
          a.toLowerCase().includes(lowerKeyword)
        )
      );
    });
  };

  /**
   * Fetch districts
   */
  useEffect(() => {
    if (!provinceName || rawProvinces.length === 0) {
      setDistricts([]);
      return;
    }

    const province = findProvince(provinceName);

    if (!province) {
      setDistricts([]);
      return;
    }

    /**
     * IMPORTANT:
     * dùng originalName/code cũ để fetch API
     * vì API chưa cập nhật sáp nhập
     */
    fetch(
      `https://provinces.open-api.vn/api/p/${province.code}?depth=2`
    )
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data.districts || []);
      })
      .catch((err) => {
        console.error('Error fetching districts:', err);
      });
  }, [provinceName, rawProvinces]);

  return {
    provinces,
    districts,
    findProvince,
  };
}