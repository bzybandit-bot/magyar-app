export type Scenario = {
  id: string;
  label: string;
  scene: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "kavezo",
    label: "Kávézó",
    scene: "Egy budapesti kávézó. Te vagy a pincér, a tanuló a vendég. Segíts rendelni.",
  },
  {
    id: "etterem",
    label: "Étterem",
    scene: "Egy étterem este. Te vagy a pincér. A tanuló asztalt kér, rendel, és fizet.",
  },
  {
    id: "bolt",
    label: "Bolt",
    scene: "Egy kis élelmiszerbolt. Te vagy az eladó. A tanuló kenyeret, tejet és gyümölcsöt vesz.",
  },
  {
    id: "piac",
    label: "Piac",
    scene: "Egy szabadtéri piac. Te árulsz zöldséget. Alkudozzatok kedvesen.",
  },
  {
    id: "edzoterem",
    label: "Edzőterem",
    scene: "Egy edzőterem. Te vagy az edző. A tanuló először jár itt, és a bérletről kérdez.",
  },
  {
    id: "iskola",
    label: "Iskola",
    scene: "Egy iskola folyosója. Te vagy a tanár. A tanuló az óráról és a házi feladatról beszél.",
  },
  {
    id: "orvos",
    label: "Orvos",
    scene: "Egy rendelő. Te vagy az orvos. A tanuló elmondja, mi fáj, te pedig kérdezel.",
  },
  {
    id: "palyaudvar",
    label: "Pályaudvar",
    scene: "A pályaudvar. Te a jegypénztárban ülsz. A tanuló jegyet és átszállást kérdez.",
  },
  {
    id: "utazas",
    label: "Utazás",
    scene: "Két ember a vonaton. Te egy kedves utas vagy. Beszélgessetek az útról és az időjárásról.",
  },
  {
    id: "baratok",
    label: "Barátok",
    scene: "Két barát egy padon a parkban. Tervet csináltok a hétvégére.",
  },
];
