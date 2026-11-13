import type { StaticImageData } from "next/image";
import heroDhakaFeast from "@/assets/images/hero_dhaka_feast_1794580943119.jpg";
import restaurantKacchiHouse from "@/assets/images/restaurant_kacchi_house_1794580942681.jpg";
import restaurantGrillExpress from "@/assets/images/restaurant_grill_express_1794580947601.jpg";
import restaurantBanglaBistro from "@/assets/images/restaurant_bangla_bistro_1794580943986.jpg";
import partnerKitchenOps from "@/assets/images/partner_kitchen_ops_1794580944136.jpg";
import cityDhaka from "@/assets/images/city_dhaka_1794581866106.jpg";
import cityChattogram from "@/assets/images/city_chattogram_1794581868889.jpg";
import citySylhet from "@/assets/images/city_sylhet_1794581868646.jpg";
import cityRajshahi from "@/assets/images/city_rajshahi_1794581869505.jpg";
import cityKhulna from "@/assets/images/city_khulna_1794581869061.jpg";
import cityCumilla from "@/assets/images/city_cumilla_1794581870064.jpg";
import cityGazipur from "@/assets/images/city_gazipur_1794581871464.jpg";
import cityNarayanganj from "@/assets/images/city_narayanganj_1794581871209.jpg";
import { CURRENCY, DEFAULT_DELIVERY_FEE } from "@/lib/config";

export const CUISINE_CATEGORIES = [
  "All",
  "Biryani & Tehari",
  "Burgers & Grill",
  "Bangla Meals",
  "Platters",
] as const;

export type CuisineCategory = (typeof CUISINE_CATEGORIES)[number];

export interface CityArea {
  id: string;
  city: string;
  neighborhoods: string;
  kitchenCount: number;
  image: StaticImageData;
  imageAlt: string;
}

export const BANGLADESH_CITIES: readonly CityArea[] = [
  {
    id: "dhaka",
    city: "Dhaka",
    neighborhoods: "Dhanmondi, Gulshan, Banani, Uttara, Mirpur",
    kitchenCount: 42,
    image: cityDhaka,
    imageAlt: "Dhaka Hatirjheel bridge and city skyline at sunset",
  },
  {
    id: "chattogram",
    city: "Chattogram",
    neighborhoods: "Agrabad, Nasirabad, GEC Circle, Halishahar",
    kitchenCount: 18,
    image: cityChattogram,
    imageAlt: "Chattogram green hills overlooking the Karnaphuli river harbor",
  },
  {
    id: "sylhet",
    city: "Sylhet",
    neighborhoods: "Zindabazar, Amberkhana, Shahjalal Upashahar",
    kitchenCount: 12,
    image: citySylhet,
    imageAlt: "Sylhet emerald green terraced tea gardens in morning mist",
  },
  {
    id: "rajshahi",
    city: "Rajshahi",
    neighborhoods: "Shaheb Bazar, Padma Residential, Kazla",
    kitchenCount: 9,
    image: cityRajshahi,
    imageAlt: "Rajshahi Padma riverfront promenade at golden sunset",
  },
  {
    id: "khulna",
    city: "Khulna",
    neighborhoods: "Shib Bari, Sonadanga, Khalishpur",
    kitchenCount: 10,
    image: cityKhulna,
    imageAlt: "Khulna Rupsha river bridge and palm-lined riverbank",
  },
  {
    id: "cumilla",
    city: "Cumilla",
    neighborhoods: "Kandirpar, Racecourse, Jhautala",
    kitchenCount: 8,
    image: cityCumilla,
    imageAlt: "Cumilla historic red terracotta ruins and green gardens",
  },
  {
    id: "gazipur",
    city: "Gazipur",
    neighborhoods: "Chowrasta, Tongi, Board Bazar",
    kitchenCount: 11,
    image: cityGazipur,
    imageAlt: "Gazipur green sal forest canopy beside a calm freshwater lake",
  },
  {
    id: "narayanganj",
    city: "Narayanganj",
    neighborhoods: "Chashara, Signboard, Siddhirganj",
    kitchenCount: 9,
    image: cityNarayanganj,
    imageAlt: "Narayanganj Sonargaon heritage brick facade and palm-lined riverfront",
  },
];

export interface MenuPreviewItem {
  id: string;
  name: string;
  variant: string;
  priceBdt: number;
  description: string;
}

export interface FeaturedRestaurant {
  id: string;
  name: string;
  city: string;
  area: string;
  cuisine: Exclude<CuisineCategory, "All">;
  prepWindow: string;
  deliveryFeeBdt: number;
  signatureDish: string;
  startingPriceBdt: number;
  image: StaticImageData;
  imageAlt: string;
  menu: readonly MenuPreviewItem[];
}

export const HERO_MEDIA = {
  image: heroDhakaFeast,
  alt: "Traditional Dhaka Kacchi Biryani in a copper handi with borhani on a modern dining table",
};

export const PARTNER_MEDIA = {
  image: partnerKitchenOps,
  alt: "Bangladeshi restaurant chef and owner packing fresh takeaway meal boxes in a clean kitchen",
};

export const FEATURED_RESTAURANTS: readonly FeaturedRestaurant[] = [
  {
    id: "sultan-handi-dhanmondi",
    name: "Nawab Handi Kitchen",
    city: "Dhaka",
    area: "Dhanmondi",
    cuisine: "Biryani & Tehari",
    prepWindow: "25-35 min",
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    signatureDish: "Basmati Mutton Kacchi",
    startingPriceBdt: 340,
    image: restaurantKacchiHouse,
    imageAlt: "Mutton tehari and kacchi biryani platter with boiled egg and fresh salad",
    menu: [
      {
        id: "nawab-kacchi-single",
        name: "Basmati Mutton Kacchi",
        variant: "1:1 Regular",
        priceBdt: 340,
        description: "Slow-cooked spiced mutton layered with fragrant saffron basmati rice and potato.",
      },
      {
        id: "nawab-tehari-beef",
        name: "Old Dhaka Beef Tehari",
        variant: "Full Box",
        priceBdt: 260,
        description: "Chinigura rice cooked in mustard oil with tender beef cubes and green chili.",
      },
      {
        id: "nawab-borhani",
        name: "Mint Spiced Borhani",
        variant: "500 ml Bottle",
        priceBdt: 90,
        description: "Chilled house-blended yogurt drink with roasted cumin and fresh mint.",
      },
    ],
  },
  {
    id: "flame-yard-banani",
    name: "Flame Yard Grill",
    city: "Dhaka",
    area: "Banani",
    cuisine: "Burgers & Grill",
    prepWindow: "20-30 min",
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    signatureDish: "Charcoal Peri-Peri Quarter",
    startingPriceBdt: 320,
    image: restaurantGrillExpress,
    imageAlt: "Charcoal grilled peri-peri chicken, double smash beef burger, and seasoned fries",
    menu: [
      {
        id: "flame-peri-quarter",
        name: "Charcoal Peri-Peri Chicken",
        variant: "Quarter + Garlic Sauce",
        priceBdt: 320,
        description: "Flame-grilled chicken marinated 24 hours in bird's eye chili and lemon herbs.",
      },
      {
        id: "flame-double-smash",
        name: "Double Smash Beef Burger",
        variant: "With Seasoned Fries",
        priceBdt: 410,
        description: "Two seared beef patties, melted cheddar, house pickles, and toasted brioche.",
      },
      {
        id: "flame-fries",
        name: "Masala Crispy Fries",
        variant: "Large Share Box",
        priceBdt: 150,
        description: "Hand-cut fries dusted with smoked paprika and black salt.",
      },
    ],
  },
  {
    id: "padma-ranna-uttara",
    name: "Padma Rannaghor",
    city: "Dhaka",
    area: "Uttara",
    cuisine: "Bangla Meals",
    prepWindow: "30-40 min",
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    signatureDish: "Bhuna Khichuri & Kala Bhuna",
    startingPriceBdt: 290,
    image: restaurantBanglaBistro,
    imageAlt: "Bangladeshi bhuna khichuri served with beef kala bhuna and fried eggplant slices",
    menu: [
      {
        id: "padma-khichuri-combo",
        name: "Bhuna Khichuri & Kala Bhuna",
        variant: "Full Combo + Begun Bhaja",
        priceBdt: 360,
        description: "Moong dal bhuna khichuri paired with slow-roasted Chattogram style beef kala bhuna.",
      },
      {
        id: "padma-ilish-meal",
        name: "Shorshe Ilish Meal Box",
        variant: "Steamed Rice + 1 Piece",
        priceBdt: 440,
        description: "Hilsa simmered in fresh ground mustard paste served with plain rice and dal.",
      },
      {
        id: "padma-deshi-chicken",
        name: "Deshi Chicken Bhuna",
        variant: "With 2 Paratha",
        priceBdt: 290,
        description: "Homestyle spiced chicken curry with flaky griddled paratha.",
      },
    ],
  },
  {
    id: "port-city-handi-ctg",
    name: "Mezban Table",
    city: "Chattogram",
    area: "Agrabad",
    cuisine: "Bangla Meals",
    prepWindow: "25-35 min",
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    signatureDish: "Authentic Mezbani Beef",
    startingPriceBdt: 330,
    image: restaurantBanglaBistro,
    imageAlt: "Spiced Chattogram style beef curry with steamed rice and traditional accompaniments",
    menu: [
      {
        id: "mezban-beef-box",
        name: "Mezbani Beef & Rice Box",
        variant: "Standard Box",
        priceBdt: 330,
        description: "Traditional Chattogram spiced beef with chana dal and steamed white rice.",
      },
      {
        id: "mezban-kala-bhuna",
        name: "Kala Bhuna Family Pack",
        variant: "Serves 2",
        priceBdt: 620,
        description: "Rich dark-roasted beef curry slow cooked with whole aromatic spices.",
      },
    ],
  },
  {
    id: "surma-dastarkhwan-sylhet",
    name: "Surma Dastarkhwan",
    city: "Sylhet",
    area: "Zindabazar",
    cuisine: "Biryani & Tehari",
    prepWindow: "25-35 min",
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    signatureDish: "Akhni Pulao & Roast",
    startingPriceBdt: 310,
    image: heroDhakaFeast,
    imageAlt: "Sylheti akhni pulao served with spiced roasted chicken and yogurt drink",
    menu: [
      {
        id: "surma-akhni",
        name: "Sylheti Beef Akhni",
        variant: "Regular Box",
        priceBdt: 310,
        description: "Fragrant Sylheti rice dish cooked in spiced beef stock with whole garlic.",
      },
      {
        id: "surma-roast-polao",
        name: "Shahi Polao & Chicken Roast",
        variant: "Full Plate",
        priceBdt: 350,
        description: "Ghee-scented polao with tender braised chicken quarter and boiled egg.",
      },
    ],
  },
  {
    id: "lakeside-smokehouse-gulshan",
    name: "Lakeside Smokehouse",
    city: "Dhaka",
    area: "Gulshan",
    cuisine: "Platters",
    prepWindow: "30-40 min",
    deliveryFeeBdt: DEFAULT_DELIVERY_FEE,
    signatureDish: "BBQ Chicken & Rice Platter",
    startingPriceBdt: 390,
    image: restaurantGrillExpress,
    imageAlt: "Grilled chicken platter with seasoned fries and house dip",
    menu: [
      {
        id: "lakeside-platter",
        name: "Smoked Chicken Platter",
        variant: "With Herb Rice & Fries",
        priceBdt: 390,
        description: "Grilled chicken leg quarter with herb butter rice, coleslaw, and garlic mayo.",
      },
      {
        id: "lakeside-steak-box",
        name: "Pepper Beef Grill Box",
        variant: "200g Strip + Mash",
        priceBdt: 540,
        description: "Char-grilled beef slices with black pepper jus and mashed potato.",
      },
    ],
  },
];

export function formatBDT(amount: number): string {
  return `${CURRENCY} ${amount.toLocaleString("en-BD")}`;
}
