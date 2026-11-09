export type Scenario = {
  id: string;
  label: string;
  scene: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "kavezo",
    label: "Cafe",
    scene: "Egy budapesti kávézó. Te vagy a pincér, a tanuló a vendég. Segíts rendelni.",
  },
  {
    id: "etterem",
    label: "Restaurant",
    scene: "Egy étterem este. Te vagy a pincér. A tanuló asztalt kér, rendel, és fizet.",
  },
  {
    id: "bolt",
    label: "Shop",
    scene: "Egy kis élelmiszerbolt. Te vagy az eladó. A tanuló kenyeret, tejet és gyümölcsöt vesz.",
  },
  {
    id: "piac",
    label: "Market",
    scene: "Egy szabadtéri piac. Te árulsz zöldséget. Alkudozzatok kedvesen.",
  },
  {
    id: "edzoterem",
    label: "Gym",
    scene: "Egy edzőterem. Te vagy az edző. A tanuló először jár itt, és a bérletről kérdez.",
  },
  {
    id: "iskola",
    label: "School",
    scene: "Egy iskola folyosója. Te vagy a tanár. A tanuló az óráról és a házi feladatról beszél.",
  },
  {
    id: "orvos",
    label: "Doctor",
    scene: "Egy rendelő. Te vagy az orvos. A tanuló elmondja, mi fáj, te pedig kérdezel.",
  },
  {
    id: "palyaudvar",
    label: "Station",
    scene: "A pályaudvar. Te a jegypénztárban ülsz. A tanuló jegyet és átszállást kérdez.",
  },
  {
    id: "utazas",
    label: "Travel",
    scene: "Két ember a vonaton. Te egy kedves utas vagy. Beszélgessetek az útról és az időjárásról.",
  },
  {
    id: "baratok",
    label: "Friends",
    scene: "Két barát egy padon a parkban. Tervet csináltok a hétvégére.",
  },
];
