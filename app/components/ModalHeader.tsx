"use client";

import { useCharterStore } from '../store/useCharterStore';
import { calculateTotals } from '../lib/calculateTotals';

export default function ModalHeader({ closeModal }: { closeModal: () => void }) {
  const s = useCharterStore();
  const selectedBoat = s.selectedBoat;
  if (!selectedBoat) return null;
  const totals = calculateTotals({
    selectedBoat: s.selectedBoat, selectedExtras: s.selectedExtras,
    cateringOrders: s.cateringOrders, drinkOrders: s.drinkOrders,
    selectedToys: s.selectedToys, selectedServices: s.selectedServices,
    selectedFees: s.selectedFees, selectedPartnerWatersports: s.selectedPartnerWatersports,
    transferPickup: s.transferPickup, transferDropoff: s.transferDropoff,
    transferPrice: s.transferPrice, transferMarkup: s.transferMarkup,
    landingEnabled: s.landingEnabled, landingFee: s.landingFee,
    defaultParkFeeEnabled: s.defaultParkFeeEnabled, defaultParkFee: s.defaultParkFee,
    defaultParkFeeAdults: s.defaultParkFeeAdults, defaultParkFeeChildren: s.defaultParkFeeChildren,
    corkageFee: s.corkageFee, extraAdults: s.extraAdults, children3to11: s.children3to11,
    childrenUnder3: s.childrenUnder3, adults: s.adults,
    customAdultPrice: s.customAdultPrice, customChildPrice: s.customChildPrice,
    boatMarkup: s.boatMarkup, fixedMarkup: s.fixedMarkup,
    markupMode: s.markupMode, markupPercent: s.markupPercent, customPrices: s.customPrices,
  });

  return (
    <>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "bold" }}>{selectedBoat.boat_name}</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>{selectedBoat.partner_name} • {selectedBoat.route_name}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Итого</p>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: "bold", color: "#059669" }}>{(totals.totalClient || 0).toLocaleString()} THB</p>
          </div>
          <button onClick={closeModal} style={{ padding: "8px 16px", backgroundColor: "#f3f4f6", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>
      </div>

      <div style={{ padding: "12px 24px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#fafafa", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", color: "#6b7280" }}>Быстрый переход:</span>
        <a href="#included" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>✅ Включено</a>
        <a href="#food" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>🍽️ Еда</a>
        <a href="#drinks" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>🍺 Напитки</a>
        <a href="#toys" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>🏄 Игрушки</a>
        <a href="#services" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>🎉 Услуги</a>
        <a href="#transfer" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>🚗 Трансфер</a>
        <a href="#fees" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>🎫 Сборы</a>
        <a href="#summary" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none" }}>📋 Итого</a>
      </div>
    </>
  );
}
