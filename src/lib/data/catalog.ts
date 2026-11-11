export type CatalogFilter = "semua" | "filsafat" | "sastra" | "sains" | "memoir";

export type CatalogBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  series: string;
  duration: string;
  filter: Exclude<CatalogFilter, "semua">;
  cover?: string;
};

export const catalogFilters: { id: CatalogFilter; label: string }[] = [
  { id: "semua", label: "Semua Koleksi" },
  { id: "filsafat", label: "Filsafat & Esai" },
  { id: "sastra", label: "Sastra Klasik" },
  { id: "sains", label: "Sains & Pemikiran" },
  { id: "memoir", label: "Memoir & Sejarah" },
];

export const catalogTotal = 42;

export const spotlightBook = {
  id: "meditations",
  eyebrow: "Sorotan Kurator Pekan Ini",
  collection: "Koleksi Terjemahan Klasik",
  title: "Meditations (Renungan Pribadi)",
  author: "Marcus Aurelius",
  role: "Terjemahan Kritis & Pengantar Filsafat Stoikisme",
  quote:
    "Anda memiliki kuasa atas pikiran Anda sendiri—bukan peristiwa eksternal. Sadarilah hal ini, dan Anda akan menemukan kekuatan batin yang tak tergoyahkan.",
  duration: "6 Jam Durasi Baca",
  cover:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-kNK9TJ_cI4dHesb25y9NMME3EtyIjejiNrNDaG48kQ_4Y-RGhG__Db7rGxlTTFWydZqwu7EMWsIGEbjaC77OnUsfi49m21euTmFPJrbmkwZWs_MCr8sPCgIr9j4TfX7GOdIepm2ex8A78PsPw0Hi25O54V3SEtmCZp08DEOD01PjY3PXkVFJwQ3yfWJvXB1n0WnUJTAQgAUVcKBeBu3VgtAeoYH9MuyVzvf0YOY",
};

export const catalogBooks: CatalogBook[] = [
  {
    id: "bumi-manusia",
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    category: "Sastra Sejarah",
    series: "Edisi Tetralogi Buru",
    duration: "± 12 jam baca",
    filter: "sastra",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCvxkYySK7cPdLYot4fi6vSecC-aiIHupkJzlJutuv7vlXG-72V_XST_1eAgU1L917Mx7AuNMntAQctZ9OhayE7PK38UzbpVMZB7OsswEkr6xB5NezxBeaQR_nNMhJryWYi5UHhA6JatqnBZP-AqLW0AGxMLfqQuF-w6Rnkjg_rqMMPKvN85DxT6emEFkgj_ZJrTjCWsEwQTHd_ywQcmdgsCKJJqSkSQcr9g-s81M",
  },
  {
    id: "filosofi-teras",
    title: "Filosofi Teras",
    author: "Henry Manampiring",
    category: "Filsafat Terapan",
    series: "Kajian Stoikisme Mental",
    duration: "± 5 jam baca",
    filter: "filsafat",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxsP2UwydD1wEet_0o6n5ss9LAu8czqD0biNyy1MsprvxilymYJUvwiO1CgPE61a44JK4wD8ciDbc_MqqMkvdyW4fEcTtD95Jd9cLVXxTtY0c57-25YWup2STfEoWzwdoMjeUYkk9w0PCrOhGTD3y79sqAsO4GXw3vFhH1QoD5h_xsUvaV0ZuLoe5N7Bbh-wT255aEuJbLZdzSTsCSyKRRK4HxPWs1F1c3zDlv7Ts",
  },
  {
    id: "dunia-sophie",
    title: "Dunia Sophie",
    author: "Jostein Gaarder",
    category: "Sejarah Pemikiran",
    series: "Pengantar Metafisika",
    duration: "± 14 jam baca",
    filter: "sains",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPTA5KY_7aW8ft39gGB_9ow8Yzo4-eCwHJ0BX-ocLZlD2pAMZ3Ltz820nYT7Wjkqv5o785aUPi0IzBbGRxSDfDClLKk_ep9IDJalWCdCGTBhTuXXYaDhJjqT7Ennh6RFZtTgR6d42qP5gFWStAKSeSKU_qRRFlNqNaAsGMLbsygqD1TjhBq3-PaqawhcZqPCBC7BEFGRaiVtRLznevNAeVf-_xwYhMc-HSIQwcv-M",
  },
  {
    id: "cantik-itu-luka",
    title: "Cantik Itu Luka",
    author: "Eka Kurniawan",
    category: "Realisme Magis",
    series: "Koleksi Fiksi Kontemporer",
    duration: "± 9 jam baca",
    filter: "sastra",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHY37jtz_U08eQ_i96w4VLmkFBYcNsXlgSUgaEpCLPZ3iHppuSlFf0EmT_5uP8mKZF19fTBFh2Fgwiu9lxDNYdCuLkzdv_rto4SJdXnBmJ-XOF_eskBAt_lMndJ9LNjYCPdwOXYgswuY7w4jrl1TIszjTEVXHzTDGdZoyR7nJmjiPHWdzwWA6hpwev1vFyLv_gOOBVrVpO-tnJr0FxeX9CJTypxnG_wcapitdQY6w",
  },
  {
    id: "catatan-pinggir",
    title: "Catatan Pinggir",
    author: "Goenawan Mohamad",
    category: "Esai Kebudayaan",
    series: "Koleksi Tempo Klasik",
    duration: "± 8 jam baca",
    filter: "filsafat",
    cover:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDw8h-WTdHGKAuqeuW9t6VWmvN04y7oQc1s8Ne7ZWsLr1YZunFOPMZxe9IjCKGXC-l1dvKgeWYxWhJjqRAXngL4VTp0fDRa4G9OVojPFk2bmqLdlfDdEo5E-94MisZe368BMcxEo8QIt5CrieueMm02XkUaGEhWySYRq8BBosJDk80m7vxMrZrZdnVIVQZhRoAwg0uAkq_0CvoJRWoh6FG5ePYewW-lgHe3VKx0F5g",
  },
  {
    id: "madilog",
    title: "Madilog",
    author: "Tan Malaka",
    category: "Pemikiran Kritis",
    series: "Manuskrip Pergerakan",
    duration: "± 15 jam baca",
    filter: "sains",
  },
];
