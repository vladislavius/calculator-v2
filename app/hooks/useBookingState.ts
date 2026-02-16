
import { useState } from 'react';
import {
    SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder,
    TransferOrder, SelectedToy, SelectedService, SelectedFee,
    SelectedPartnerWatersport, Lang, Partner, SimpleBoat, SimpleRoute,
    BoatDrink, RouteFee, StaffService, CateringPartner, CateringMenuItem,
    WatersportsPartner, WatersportsCatalogItem, TransferOptionDB
} from '../lib/types';

export const useBookingState = () => {
    // Search state
    const [searchDate, setSearchDate] = useState('');
    const [adults, setAdults] = useState(2);
    const [extraAdults, setExtraAdults] = useState(0);
    const [children3to11, setChildren3to11] = useState(0);
    const [childrenUnder3, setChildrenUnder3] = useState(0);
    const [customAdultPrice, setCustomAdultPrice] = useState<number | null>(null);
    const [customChildPrice, setCustomChildPrice] = useState<number | null>(null);
    const [customNotes, setCustomNotes] = useState<string>('');
    const [boatType, setBoatType] = useState('');
    const [destination, setDestination] = useState('');
    const [boatNameSearch, setBoatNameSearch] = useState('');
    const [boatPartners, setBoatPartners] = useState<Partner[]>([]);
    const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('');
    const [allBoats, setAllBoats] = useState<SimpleBoat[]>([]);
    const [allRoutes, setAllRoutes] = useState<SimpleRoute[]>([]);
    const [showBoatSuggestions, setShowBoatSuggestions] = useState(false);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [timeSlot, setTimeSlot] = useState('full_day');
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [sortBy, setSortBy] = useState('price_asc');
    const [season, setSeason] = useState('auto');

    // Results state
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [selectedBoat, setSelectedBoat] = useState<SearchResult | null>(null);
    const [boatOptions, setBoatOptions] = useState<BoatOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Agent mode
    const [showAgentPrice, setShowAgentPrice] = useState(true);
    const [markupPercent, setMarkupPercent] = useState(0);
    const [boatMarkup, setBoatMarkup] = useState(0);
    const [markupMode, setMarkupMode] = useState<"percent" | "fixed">("fixed");
    const [fixedMarkup, setFixedMarkup] = useState(0);

    // Selections
    const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
    const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);
    const [drinkOrders, setDrinkOrders] = useState<DrinkOrder[]>([]);
    const [selectedToys, setSelectedToys] = useState<any[]>([]);
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [selectedFees, setSelectedFees] = useState<any[]>([]);
    const [selectedPartnerWatersports, setSelectedPartnerWatersports] = useState<any[]>([]);
    const [specialOccasion, setSpecialOccasion] = useState('');
    const [dietaryRequirements, setDietaryRequirements] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    // Loaded Data from DB (Partners, Menus, etc.)
    const [cateringPartners, setCateringPartners] = useState<CateringPartner[]>([]);
    const [cateringMenu, setCateringMenu] = useState<CateringMenuItem[]>([]);
    const [partnerMenus, setPartnerMenus] = useState<any[]>([]);
    const [partnerMenuSets, setPartnerMenuSets] = useState<any[]>([]);
    const [watersportsPartners, setWatersportsPartners] = useState<WatersportsPartner[]>([]);
    const [watersportsCatalog, setWatersportsCatalog] = useState<WatersportsCatalogItem[]>([]);
    const [transferOptionsDB, setTransferOptionsDB] = useState<TransferOptionDB[]>([]);

    // Specific Boat Data
    const [boatDrinks, setBoatDrinks] = useState<BoatDrink[]>([]);
    const [routeFees, setRouteFees] = useState<RouteFee[]>([]);
    const [staffServices, setStaffServices] = useState<StaffService[]>([]);
    const [boatMenu, setBoatMenu] = useState<any[]>([]);

    // Transfer
    const [transferPickup, setTransferPickup] = useState<TransferOrder>({
        type: 'none', pickup: '', dropoff: 'Marina', price: 0, notes: ''
    });
    const [transferDropoff, setTransferDropoff] = useState<TransferOrder>({
        type: 'none', pickup: 'Marina', dropoff: '', price: 0, notes: ''
    });
    const [transferDirection, setTransferDirection] = useState<'round_trip' | 'one_way'>('round_trip');
    const [customTransferPrice, setCustomTransferPrice] = useState<number | null>(null);
    const [useOwnTransfer, setUseOwnTransfer] = useState(false);
    const [ownTransferPriceOneWay, setOwnTransferPriceOneWay] = useState(1000);
    const [ownTransferPriceRoundTrip, setOwnTransferPriceRoundTrip] = useState(2000);
    const [ownTransferVipPriceRoundTrip, setOwnTransferVipPriceRoundTrip] = useState(4000);
    const [ownTransferVipPriceOneWay, setOwnTransferVipPriceOneWay] = useState(2000);
    const [useOwnTransferVip, setUseOwnTransferVip] = useState(false);
    const [transferPrice, setTransferPrice] = useState(0);
    const [transferMarkup, setTransferMarkup] = useState(15);

    // Other Global State
    const [lang, setLang] = useState<Lang>("ru");
    const [partnerMarkups, setPartnerMarkups] = useState<{ [key: string]: number }>({});
    const [customPrices, setCustomPrices] = useState<{ [key: string]: number }>({});
    const [corkageFee, setCorkageFee] = useState(0);
    const [byobAllowed, setByobAllowed] = useState(false); // Added
    const [landingFee, setLandingFee] = useState<number>(0);
    const [landingEnabled, setLandingEnabled] = useState<boolean>(false);
    const [defaultParkFee, setDefaultParkFee] = useState<number>(0);
    const [defaultParkFeeEnabled, setDefaultParkFeeEnabled] = useState<boolean>(false);
    const [defaultParkFeeAdults, setDefaultParkFeeAdults] = useState<number>(2);
    const [defaultParkFeeChildren, setDefaultParkFeeChildren] = useState<number>(0);

    // UI State
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
        boatFood: true,
        boatDrinks: true,
        boatToys: true,
        partnerCatering: false,
        partnerWatersports: false,
        partnerDecor: false
    });
    const [activeTab, setActiveTab] = useState<'included' | 'food' | 'drinks' | 'toys' | 'services' | 'transfer' | 'fees' | 'summary'>('included');

    // Customer Info
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Selected Dishes (for menu sets)
    const [selectedDishes, setSelectedDishes] = useState<Record<string, number>>({});

    return {
        state: {
            searchDate, adults, extraAdults, children3to11, childrenUnder3, customAdultPrice, customChildPrice, customNotes,
            boatType, destination, boatNameSearch, boatPartners, selectedPartnerFilter, allBoats, allRoutes,
            showBoatSuggestions, showDestinationSuggestions, timeSlot, minBudget, maxBudget, sortBy, season,
            results, loading, selectedBoat, boatOptions, loadingOptions, showAgentPrice, markupPercent, boatMarkup, markupMode, fixedMarkup,
            selectedExtras, cateringOrders, drinkOrders, selectedToys, selectedServices, selectedFees, selectedPartnerWatersports,
            specialOccasion, dietaryRequirements, specialRequests,
            cateringPartners, cateringMenu, partnerMenus, partnerMenuSets, watersportsPartners, watersportsCatalog, transferOptionsDB,
            boatDrinks, routeFees, staffServices, boatMenu,
            transferPickup, transferDropoff, transferDirection, customTransferPrice, useOwnTransfer, ownTransferPriceOneWay,
            ownTransferPriceRoundTrip, ownTransferVipPriceRoundTrip, ownTransferVipPriceOneWay, useOwnTransferVip, transferPrice, transferMarkup,
            lang, partnerMarkups, customPrices, corkageFee, byobAllowed, landingFee, landingEnabled, defaultParkFee, defaultParkFeeEnabled,
            defaultParkFeeAdults, defaultParkFeeChildren, expandedSections, activeTab,
            customerName, customerPhone, customerEmail, selectedDishes
        },
        setters: {
            setSearchDate, setAdults, setExtraAdults, setChildren3to11, setChildrenUnder3, setCustomAdultPrice, setCustomChildPrice, setCustomNotes,
            setBoatType, setDestination, setBoatNameSearch, setBoatPartners, setSelectedPartnerFilter, setAllBoats, setAllRoutes,
            setShowBoatSuggestions, setShowDestinationSuggestions, setTimeSlot, setMinBudget, setMaxBudget, setSortBy, setSeason,
            setResults, setLoading, setSelectedBoat, setBoatOptions, setLoadingOptions, setShowAgentPrice, setMarkupPercent, setBoatMarkup, setMarkupMode, setFixedMarkup,
            setSelectedExtras, setCateringOrders, setDrinkOrders, setSelectedToys, setSelectedServices, setSelectedFees, setSelectedPartnerWatersports,
            setSpecialOccasion, setDietaryRequirements, setSpecialRequests,
            setCateringPartners, setCateringMenu, setPartnerMenus, setPartnerMenuSets, setWatersportsPartners, setWatersportsCatalog, setTransferOptionsDB,
            setBoatDrinks, setRouteFees, setStaffServices, setBoatMenu,
            setTransferPickup, setTransferDropoff, setTransferDirection, setCustomTransferPrice, setUseOwnTransfer, setOwnTransferPriceOneWay,
            setOwnTransferPriceRoundTrip, setOwnTransferVipPriceRoundTrip, setOwnTransferVipPriceOneWay, setUseOwnTransferVip, setTransferPrice, setTransferMarkup,
            setLang, setPartnerMarkups, setCustomPrices, setCorkageFee, setByobAllowed, setLandingFee, setLandingEnabled, setDefaultParkFee, setDefaultParkFeeEnabled,
            setDefaultParkFeeAdults, setDefaultParkFeeChildren, setExpandedSections, setActiveTab,
            setCustomerName, setCustomerPhone, setCustomerEmail, setSelectedDishes
        }
    };
};
