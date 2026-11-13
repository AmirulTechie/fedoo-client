"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { MotionConfig, motion } from "motion/react";
import {
  ArrowRight,
  LocateFixed,
  MapPin,
  Search,
  Store,
} from "lucide-react";
import FedooLogo from "@/components/FedooLogo";
import Navbar from "@/components/Navbar";
import PartnerModal from "@/components/PartnerModal";
import RestaurantDrawer from "@/components/RestaurantDrawer";
import SignInModal from "@/components/SignInModal";
import { DEFAULT_DELIVERY_FEE, PAYMENT_METHODS } from "@/lib/config";
import {
  BANGLADESH_CITIES,
  CUISINE_CATEGORIES,
  FEATURED_RESTAURANTS,
  HERO_MEDIA,
  PARTNER_MEDIA,
  formatBDT,
  type CuisineCategory,
  type FeaturedRestaurant,
} from "@/lib/landing-data";

const HOW_IT_WORKS_STEPS = [
  {
    number: "01.",
    title: "Enter your city or area",
    description:
      "Choose your neighborhood in Dhaka, Chattogram, Sylhet, or nearby cities to browse nearby kitchens ready to cook.",
  },
  {
    number: "02.",
    title: "Pick what you are craving",
    description:
      "Explore kacchi, smash burgers, grill platters, and home-style Bangla meals with transparent BDT prices.",
  },
  {
    number: "03.",
    title: "Pay Cash on Delivery",
    description:
      "Place your order in seconds, track kitchen preparation updates, and pay in cash when your meal arrives.",
  },
] as const;

export default function LandingPage() {
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedCuisine, setSelectedCuisine] =
    useState<CuisineCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  const [activeRestaurant, setActiveRestaurant] =
    useState<FeaturedRestaurant | null>(null);
  const [signInOpen, setSignInOpen] = useState<boolean>(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState<boolean>(false);

  const restaurantsRef = useRef<HTMLElement | null>(null);
  const filterTimeoutRef = useRef<number | null>(null);

  const heroPrimaryKitchen = FEATURED_RESTAURANTS[0];
  const heroSecondaryKitchen = FEATURED_RESTAURANTS[1];
  const heroTertiaryKitchen = FEATURED_RESTAURANTS[2];

  const triggerFilterFeedback = () => {
    if (filterTimeoutRef.current !== null) {
      window.clearTimeout(filterTimeoutRef.current);
    }
    setIsFiltering(true);
    filterTimeoutRef.current = window.setTimeout(() => {
      setIsFiltering(false);
    }, 180);
  };

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FEATURED_RESTAURANTS.filter((restaurant) => {
      const cityMatch =
        selectedCity === "All" || restaurant.city === selectedCity;
      const cuisineMatch =
        selectedCuisine === "All" || restaurant.cuisine === selectedCuisine;
      const queryMatch =
        query.length === 0 ||
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.area.toLowerCase().includes(query) ||
        restaurant.city.toLowerCase().includes(query) ||
        restaurant.signatureDish.toLowerCase().includes(query) ||
        restaurant.cuisine.toLowerCase().includes(query);

      return cityMatch && cuisineMatch && queryMatch;
    });
  }, [selectedCity, selectedCuisine, searchQuery]);

  const scrollToRestaurants = () => {
    restaurantsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHeroSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerFilterFeedback();
    scrollToRestaurants();
  };

  const handleQuickLocate = () => {
    setSelectedCity("Dhaka");
    setSearchQuery("Dhanmondi");
    triggerFilterFeedback();
    scrollToRestaurants();
  };

  const handleSelectCityCard = (cityName: string) => {
    setSelectedCity(cityName);
    setSelectedCuisine("All");
    triggerFilterFeedback();
    scrollToRestaurants();
  };

  const handleClearFilters = () => {
    setSelectedCity("All");
    setSelectedCuisine("All");
    setSearchQuery("");
    triggerFilterFeedback();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col overflow-x-hidden bg-white text-zinc-900">
        <Navbar onOpenSignIn={() => setSignInOpen(true)} />

        <main className="flex-1">
          {/* Customer-First Hero (Foodpanda-inspired location discovery + food showcase) */}
          <section className="bg-[#99132B] text-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
                <div className="flex flex-col justify-center lg:col-span-6">
                  <p className="text-xs font-medium tracking-wide text-rose-100">
                    Dhaka · Chattogram · Sylhet · {PAYMENT_METHODS[0]}
                  </p>

                  <h1 className="mt-3 font-[family-name:var(--font-plus-jakarta)] text-[clamp(2rem,4.2vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-white text-balance">
                    It&apos;s the food you love, delivered to your door.
                  </h1>

                  <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-rose-100">
                    Order hot kacchi, flame-grilled burgers, and home-style
                    Bangla meals from nearby kitchens with quick doorstep
                    delivery.
                  </p>

                  {/* Address / Area & Dish Search Bar */}
                  <form
                    onSubmit={handleHeroSearchSubmit}
                    className="mt-6 sm:mt-8 rounded-xl bg-white p-2 text-zinc-950 shadow-lg"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative flex items-center sm:w-40 shrink-0">
                        <MapPin
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 h-4 w-4 text-[#B01833]"
                        />
                        <label htmlFor="hero-city-select" className="sr-only">
                          Delivery city
                        </label>
                        <select
                          id="hero-city-select"
                          value={selectedCity}
                          onChange={(e) => {
                            setSelectedCity(e.target.value);
                            triggerFilterFeedback();
                          }}
                          className="h-11 w-full rounded-lg bg-zinc-50 pl-9 pr-3 text-base sm:text-sm font-medium text-zinc-900 border border-zinc-200 focus:border-[#B01833] focus:outline-none"
                        >
                          <option value="All">All Cities</option>
                          {BANGLADESH_CITIES.map((item) => (
                            <option key={item.id} value={item.city}>
                              {item.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative flex flex-1 items-center">
                        <Search
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-400"
                        />
                        <label htmlFor="hero-food-search" className="sr-only">
                          Enter your area or search a dish
                        </label>
                        <input
                          id="hero-food-search"
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Enter your area or dish (Dhanmondi, kacchi...)"
                          className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-24 text-base sm:text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-[#B01833] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleQuickLocate}
                          aria-label="Use popular Dhaka location"
                          className="absolute right-1.5 inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-[#B01833] hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LocateFixed className="h-3.5 w-3.5" />
                          <span className="hidden xs:inline sm:inline">
                            Locate
                          </span>
                        </button>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full sm:w-auto min-h-11 px-6 py-2.5 text-sm font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 cursor-pointer"
                      >
                        Find Food
                      </motion.button>
                    </div>
                  </form>

                  <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-rose-100">
                    <span>Popular areas:</span>
                    {["Dhanmondi", "Banani", "Uttara", "Agrabad", "Zindabazar"].map(
                      (area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => {
                            setSearchQuery(area);
                            setSelectedCity("All");
                            triggerFilterFeedback();
                            scrollToRestaurants();
                          }}
                          className="min-h-8 font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white cursor-pointer"
                        >
                          {area}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Right Column: Interactive 3-Dish Tasting Mosaic */}
                <div className="lg:col-span-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveRestaurant(heroPrimaryKitchen)}
                      className="group relative col-span-2 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                    >
                      <Image
                        src={HERO_MEDIA.image}
                        alt={HERO_MEDIA.alt}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        referrerPolicy="no-referrer"
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
                        <div>
                          <p className="text-xs text-rose-100">
                            {heroPrimaryKitchen.area}, {heroPrimaryKitchen.city} ·{" "}
                            {heroPrimaryKitchen.prepWindow}
                          </p>
                          <p className="mt-0.5 font-[family-name:var(--font-plus-jakarta)] text-base sm:text-lg font-bold text-white">
                            {heroPrimaryKitchen.signatureDish}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
                          {formatBDT(heroPrimaryKitchen.startingPriceBdt)}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveRestaurant(heroSecondaryKitchen)}
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/15 bg-zinc-900 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                    >
                      <Image
                        src={heroSecondaryKitchen.image}
                        alt={heroSecondaryKitchen.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        referrerPolicy="no-referrer"
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                        <p className="text-[11px] sm:text-xs text-rose-100 truncate">
                          {heroSecondaryKitchen.area} ·{" "}
                          {formatBDT(heroSecondaryKitchen.startingPriceBdt)}
                        </p>
                        <p className="mt-0.5 truncate font-[family-name:var(--font-plus-jakarta)] text-xs sm:text-sm font-bold text-white">
                          {heroSecondaryKitchen.name}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveRestaurant(heroTertiaryKitchen)}
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/15 bg-zinc-900 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                    >
                      <Image
                        src={heroTertiaryKitchen.image}
                        alt={heroTertiaryKitchen.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        referrerPolicy="no-referrer"
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                        <p className="text-[11px] sm:text-xs text-rose-100 truncate">
                          {heroTertiaryKitchen.area} ·{" "}
                          {formatBDT(heroTertiaryKitchen.startingPriceBdt)}
                        </p>
                        <p className="mt-0.5 truncate font-[family-name:var(--font-plus-jakarta)] text-xs sm:text-sm font-bold text-white">
                          {heroTertiaryKitchen.name}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Customer Value Strip directly below Hero */}
          <section className="border-b border-zinc-200 bg-zinc-50/70">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
                <div>
                  <p className="font-[family-name:var(--font-plus-jakarta)] text-xl sm:text-2xl font-bold tabular-nums text-zinc-950">
                    25-35 min
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Hot kitchen prep to your doorstep
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-plus-jakarta)] text-xl sm:text-2xl font-bold tabular-nums text-zinc-950">
                    {formatBDT(DEFAULT_DELIVERY_FEE)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Flat neighborhood delivery fee
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-plus-jakarta)] text-xl sm:text-2xl font-bold text-zinc-950">
                    Cash
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Simple Cash on Delivery at your door
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-plus-jakarta)] text-xl sm:text-2xl font-bold tabular-nums text-zinc-950">
                    {BANGLADESH_CITIES.length} cities
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Delivering across Bangladesh
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Popular Kitchens & Craving Browser */}
          <section
            id="restaurants"
            ref={restaurantsRef}
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Popular kitchens near you
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {selectedCity === "All"
                    ? "Browse freshly prepared dishes ready for Cash on Delivery."
                    : `Showing kitchens delivering in ${selectedCity}.`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div
                  role="tablist"
                  aria-label="Filter restaurants by cuisine"
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full rounded-lg bg-zinc-100 p-1"
                >
                  {CUISINE_CATEGORIES.map((cuisine) => {
                    const active = selectedCuisine === cuisine;
                    return (
                      <button
                        key={cuisine}
                        role="tab"
                        aria-selected={active}
                        type="button"
                        onClick={() => {
                          setSelectedCuisine(cuisine);
                          triggerFilterFeedback();
                        }}
                        className={`min-h-10 sm:min-h-9 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? "bg-white text-zinc-950 shadow-sm"
                            : "text-zinc-600 hover:text-zinc-950"
                        }`}
                      >
                        {cuisine}
                      </button>
                    );
                  })}
                </div>

                {(selectedCity !== "All" ||
                  selectedCuisine !== "All" ||
                  searchQuery.trim().length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="self-start sm:self-auto min-h-9 px-2 sm:px-3 py-1.5 text-xs font-medium text-[#B01833] hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {isFiltering ? (
              <div
                aria-label="Loading restaurants"
                className="mt-6 sm:mt-8 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {[1, 2, 3].map((slot) => (
                  <div
                    key={slot}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                  >
                    <div className="aspect-[4/3] w-full bg-zinc-100" />
                    <div className="p-4 sm:p-5 space-y-3">
                      <div className="h-3 w-40 rounded bg-zinc-100" />
                      <div className="h-5 w-48 rounded bg-zinc-200" />
                      <div className="h-4 w-32 rounded bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="mt-6 sm:mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-10 sm:px-6 sm:py-12 text-center">
                <Store
                  aria-hidden="true"
                  className="mx-auto h-8 w-8 text-zinc-400"
                />
                <h3 className="mt-3 font-[family-name:var(--font-plus-jakarta)] text-lg font-semibold text-zinc-950">
                  No kitchens match your current filter
                </h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600">
                  {selectedCity !== "All"
                    ? `More local kitchens in ${selectedCity} are joining soon. Clear filters to explore all active restaurants.`
                    : "Try another dish, area name, or clear your search filter to view all kitchens."}
                </p>
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="min-h-11 rounded-lg bg-[#B01833] px-5 py-2 text-sm font-semibold text-white hover:bg-[#911329] transition-colors cursor-pointer"
                  >
                    Show All Kitchens
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRestaurants.map((restaurant) => (
                  <article
                    key={restaurant.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                      <Image
                        src={restaurant.image}
                        alt={restaurant.imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <p className="text-xs text-zinc-500">
                        {restaurant.area}, {restaurant.city} ·{" "}
                        {restaurant.cuisine} · {restaurant.prepWindow}
                      </p>

                      <h3 className="mt-1.5 font-[family-name:var(--font-plus-jakarta)] text-lg font-bold text-zinc-950">
                        {restaurant.name}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-600">
                        Popular: {restaurant.signatureDish}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-100 pt-4">
                        <div>
                          <p className="text-xs text-zinc-500">From</p>
                          <p className="text-sm font-semibold tabular-nums text-zinc-950">
                            {formatBDT(restaurant.startingPriceBdt)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveRestaurant(restaurant)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white hover:bg-[#B01833] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          View Menu
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Cities We Serve Across Bangladesh (Foodpanda-style city cards) */}
          <section
            id="cities"
            className="border-t border-zinc-200 bg-zinc-50/70"
          >
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <div className="max-w-2xl">
                <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                  Find us in these cities and many more
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Select your city to explore local neighborhoods and restaurants
                  delivering near you.
                </p>
              </div>

              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {BANGLADESH_CITIES.map((cityItem) => {
                  const isSelected = selectedCity === cityItem.city;
                  return (
                    <button
                      key={cityItem.id}
                      type="button"
                      onClick={() => handleSelectCityCard(cityItem.city)}
                      className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#B01833] bg-rose-50/40 ring-1 ring-[#B01833]"
                          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                        <Image
                          src={cityItem.image}
                          alt={cityItem.imageAlt}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                          referrerPolicy="no-referrer"
                          className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-3 sm:p-4">
                        <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-2">
                          <span className="font-[family-name:var(--font-plus-jakarta)] text-sm sm:text-base font-bold text-zinc-950">
                            {cityItem.city}
                          </span>
                          <span className="text-xs font-medium tabular-nums text-zinc-500">
                            {cityItem.kitchenCount} areas
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-2">
                          {cityItem.neighborhoods}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* How Ordering Works */}
          <section
            id="how-it-works"
            className="border-t border-zinc-200 bg-white"
          >
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
                Ordering made simple
              </h2>

              <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
                {HOW_IT_WORKS_STEPS.map((step) => (
                  <div
                    key={step.number}
                    className="border-t border-zinc-200 pt-4 sm:pt-5"
                  >
                    <p className="font-[family-name:var(--font-plus-jakarta)] text-sm font-bold tabular-nums text-[#B01833]">
                      {step.number}
                    </p>
                    <h3 className="mt-2 font-[family-name:var(--font-plus-jakarta)] text-lg font-bold text-zinc-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Foodpanda-style Compact Partner Banner */}
          <section
            id="partners"
            className="border-t border-zinc-200 bg-zinc-50/70"
          >
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
                  <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[300px] lg:col-span-6 bg-zinc-100">
                    <Image
                      src={PARTNER_MEDIA.image}
                      alt={PARTNER_MEDIA.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-6">
                    <h2 className="font-[family-name:var(--font-plus-jakarta)] text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl text-balance">
                      You prepare the food, we bring the neighborhood.
                    </h2>
                    <p className="mt-3 text-sm sm:text-base leading-relaxed text-zinc-600">
                      Would you like hungry customers across your city to
                      discover your menu? List your restaurant on Fedoo and
                      start receiving online orders in minutes.
                    </p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setPartnerModalOpen(true)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#B01833] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#911329] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <FedooLogo size="sm" />
              <p className="mt-1.5 text-xs text-zinc-500">
                Fresh neighborhood food delivery across Bangladesh.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-zinc-600">
              <a href="#restaurants" className="py-1 hover:text-zinc-950">
                Restaurants
              </a>
              <a href="#cities" className="py-1 hover:text-zinc-950">
                Cities
              </a>
              <a href="#how-it-works" className="py-1 hover:text-zinc-950">
                How It Works
              </a>
              <button
                type="button"
                onClick={() => setPartnerModalOpen(true)}
                className="py-1 hover:text-zinc-950 cursor-pointer"
              >
                Partner With Us
              </button>
              <span className="text-zinc-400">
                Support: support@fedoo.bd
              </span>
            </div>
          </div>
        </footer>

        <RestaurantDrawer
          key={activeRestaurant?.id ?? "closed"}
          restaurant={activeRestaurant}
          onClose={() => setActiveRestaurant(null)}
        />

        <SignInModal
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
        />

        <PartnerModal
          open={partnerModalOpen}
          onClose={() => setPartnerModalOpen(false)}
        />
      </div>
    </MotionConfig>
  );
}
