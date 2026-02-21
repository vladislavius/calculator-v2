'use client';
import { useCharterStore } from '../store/useCharterStore';
import { calculateTotals } from '../lib/calculateTotals';

type TabKey = 'included'|'food'|'drinks'|'toys'|'services'|'transfer'|'fees'|'summary';
const TABS: { key:TabKey; icon:string; label:string }[] = [
  { key:'included', icon:'✅', label:'Включено'  },
  { key:'food',     icon:'🍽️', label:'Питание'   },
  { key:'drinks',   icon:'🍹', label:'Напитки'   },
  { key:'toys',     icon:'🤿', label:'Игрушки'   },
  { key:'services', icon:'🎉', label:'Услуги'    },
  { key:'transfer', icon:'🚐', label:'Трансфер'  },
  { key:'fees',     icon:'🎫', label:'Сборы'     },
  { key:'summary',  icon:'💰', label:'Итого'     },
];

export default function ModalHeader({ closeModal }: { closeModal:()=>void }) {
  const s    = useCharterStore();
  const boat = s.selectedBoat;
  if (!boat) return null;

  const totals = calculateTotals({
    selectedBoat:s.selectedBoat, selectedExtras:s.selectedExtras, cateringOrders:s.cateringOrders,
    drinkOrders:s.drinkOrders, selectedToys:s.selectedToys, selectedServices:s.selectedServices,
    selectedFees:s.selectedFees, selectedPartnerWatersports:s.selectedPartnerWatersports,
    transferPickup:s.transferPickup, transferDropoff:s.transferDropoff, transferPrice:s.transferPrice,
    transferMarkup:s.transferMarkup, landingEnabled:s.landingEnabled, landingFee:s.landingFee,
    defaultParkFeeEnabled:s.defaultParkFeeEnabled, defaultParkFee:s.defaultParkFee,
    defaultParkFeeAdults:s.defaultParkFeeAdults, defaultParkFeeChildren:s.defaultParkFeeChildren,
    corkageFee:s.corkageFee, extraAdults:s.extraAdults, children3to11:s.children3to11,
    childrenUnder3:s.childrenUnder3, adults:s.adults, customAdultPrice:s.customAdultPrice,
    customChildPrice:s.customChildPrice, boatMarkup:s.boatMarkup, fixedMarkup:s.fixedMarkup,
    markupMode:s.markupMode, markupPercent:s.markupPercent, customPrices:s.customPrices,
  });

  const counts: Record<TabKey,number> = {
    included:0,
    food:    s.cateringOrders.length,
    drinks:  s.drinkOrders.filter(d=>!d.included).length,
    toys:    s.selectedToys.length + s.selectedPartnerWatersports.length,
    services:s.selectedServices.length,
    transfer:s.transferPickup.type!=='none'||s.transferDropoff.type!=='none'?1:0,
    fees:    s.selectedFees.length,
    summary: 0,
  };

  return (
    <>
      <div className="os-modal-header">
        <div className="os-modal-header__info">
          <div className="os-modal-header__name">{boat.boat_name}</div>
          <div className="os-modal-header__meta">{boat.partner_name} · {boat.route_name}</div>
        </div>
        <div className="os-modal-header__total-wrap">
          <div className="os-modal-header__total-label">Итого клиент</div>
          <div className="os-modal-header__total">{(totals.totalClient||0).toLocaleString()} ฿</div>
        </div>
        <button className="os-modal-close" onClick={closeModal}>✕</button>
      </div>
      <div className="os-tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`os-tab-btn${s.activeTab===tab.key?' active':''}`}
            onClick={() => {
              s.set({ activeTab: tab.key });
              document.getElementById(tab.key)?.scrollIntoView({ behavior:'smooth', block:'start' });
            }}
          >
            <span>{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
            {counts[tab.key] > 0 && <span className="os-tab-count">{counts[tab.key]}</span>}
          </button>
        ))}
      </div>
    </>
  );
}
