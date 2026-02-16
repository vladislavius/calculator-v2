
import { calculateTotals } from '../app/lib/calculateTotals';
import {
    SearchResult, BoatOption, SelectedExtra, CateringOrder, DrinkOrder,
    TransferOrder, SelectedToy, SelectedService, SelectedFee,
    SelectedPartnerWatersport, BoatMenu, PartnerMenu
} from '../app/lib/types';

// Mock Data
const mockBoat: SearchResult = {
    boat_id: 1,
    boat_name: "Test Yacht",
    partner_id: 1,
    partner_name: "Test Partner",
    route_id: 1,
    route_name: "Test Route",
    duration_hours: 8,
    max_guests: 10,
    base_price: 10000,
    price_morning: null,
    price_afternoon: null,
    price_sunset: null,
    price_full_day: 10000,
    calculated_total: 10000,
    calculated_agent_total: 8000,
    base_pax: 2,
    marina_name: "Test Marina",
    agent_price: 8000,
    client_price: 10000,
    extra_pax_price: 500,
    child_price_3_11: 250,
    child_free_under: 3,
    fuel_surcharge: 0,
    boat_type: "yacht",
    length_ft: 50,
    cabin_count: 2,
    crew_count: 2,
    description: "Test",
    main_photo_url: ""
};

const mockToy: SelectedToy = {
    id: 1,
    name: "Jet Ski",
    quantity: 2,
    hours: 2,
    days: 0,
    pricePerHour: 1000, // 2 * 2 * 1000 = 4000
    pricePerDay: 5000
};

const mockCatering: CateringOrder = {
    packageId: "menu_1",
    packageName: "Lunch",
    pricePerPerson: 500,
    persons: 5, // 5 * 500 = 2500
    notes: ""
};

const mockDrink: DrinkOrder = {
    drinkId: 1,
    name: "Cola",
    price: 50,
    quantity: 10, // 50 * 10 = 500
    unit: "can",
    included: false
};

const mockTransfer: TransferOrder = {
    type: "minivan",
    pickup: "Include",
    dropoff: "Include",
    price: 2000, // 2000 + markup?
    notes: ""
};

const mockFee: SelectedFee = {
    id: 1,
    name: "Park Fee",
    adults: 2,
    children: 0,
    pricePerPerson: 400 // 2 * 400 = 800
};

// Params
const params = {
    selectedBoat: mockBoat,
    selectedExtras: [],
    cateringOrders: [mockCatering],
    drinkOrders: [mockDrink],
    selectedToys: [mockToy],
    selectedServices: [],
    selectedFees: [mockFee],
    selectedPartnerWatersports: [],
    transferPickup: mockTransfer,
    transferDropoff: { type: 'none', pickup: '', dropoff: '', price: 0, notes: '' },

    // Set transferPrice to 0 to test pure pickup/dropoff logic. 
    // If we set this to 2000, the total transfer cost would be 2000 (pickup) + 2000 (transferPrice) = 4000.
    // We want to verify that pickup price is correctly included.
    transferPrice: 0,

    transferMarkup: 0,
    landingEnabled: false,
    landingFee: 0,
    defaultParkFeeEnabled: false,
    defaultParkFee: 0,
    defaultParkFeeAdults: 0,
    defaultParkFeeChildren: 0,
    corkageFee: 0,
    extraAdults: 0,
    children3to11: 0,
    childrenUnder3: 0,
    adults: 5,
    customAdultPrice: null,
    customChildPrice: null,
    boatMarkup: 0,
    fixedMarkup: 0,
    markupMode: 'percent' as const,
    markupPercent: 0,
    customPrices: {}
};

console.log("Running verification...");

const result = calculateTotals(params);

console.log("---------------------------------------------------");
console.log("Total Client Result:", result.totalClient);
console.log("---------------------------------------------------");
console.log("Items:");
result.items.forEach(item => {
    console.log(`- [${item.category}] ${item.name}: ${item.quantity} x ${item.price} = ${item.total} THB`);
});

// Verification assertions
const expectedBoat = 10000;
const expectedToy = 2 * 2 * 1000; // 4000
const expectedCatering = 5 * 500; // 2500
const expectedDrink = 10 * 50; // 500
const expectedTransfer = 2000; // Only pickup price
const expectedFee = 2 * 400; // 800
const expectedTotal = expectedBoat + expectedToy + expectedCatering + expectedDrink + expectedTransfer + expectedFee; // 19800

if (result.totalClient === expectedTotal) {
    console.log("\n✅ SUCCESS: Calculated total matches expected total (" + expectedTotal + ")");
} else {
    console.error("\n❌ FAILED: Expected " + expectedTotal + ", got " + result.totalClient);
}

// Check if items array is populated
if (result.items.length > 0) {
    console.log("✅ SUCCESS: Items array is populated");
} else {
    console.error("❌ FAILED: Items array is empty");
}
