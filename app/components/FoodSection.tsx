'use client';

import { SearchResult, BoatOption, SelectedExtra, CateringOrder } from '../lib/types';
import { t, Lang } from '../lib/i18n';

interface BoatMenuItem {
  id: number;
  name_en: string;
  name_ru?: string;
  category?: string;
  price: number;
  included: boolean;
  from_partner_menu?: boolean;
  dishes?: string[];
  dishes_ru?: string[];
}

interface CateringPartner {
  id: number;
  name: string;
  description?: string;
}

interface CateringMenuItem {
  id: number;
  partner_id: number;
  name_en: string;
  name_ru?: string;
  price_per_person: number;
  min_persons: number;
}

interface PartnerMenu {
  partner_id: number;
  conditions?: string;
  conditions_ru?: string;
}

interface FoodSectionProps {
  selectedBoat: SearchResult | null;
  boatMenu: BoatMenuItem[];
  boatOptions: BoatOption[];
  cateringOrders: CateringOrder[];
  setCateringOrders: (orders: CateringOrder[]) => void;
  cateringPartners: CateringPartner[];
  cateringMenu: CateringMenuItem[];
  partnerMenus: PartnerMenu[];
  selectedExtras: SelectedExtra[];
  toggleExtra: (opt: BoatOption) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  customPrices: Record<string, number>;
  getPrice: (key: string, defaultPrice: number) => number;
  setPrice: (key: string, value: number) => void;
  addMenuItem: (item: any) => void;
  updateCateringPersons: (index: number, persons: number) => void;
  adults: number;
  children3to11: number;
  selectedDishes: Record<string, number>;
  setSelectedDishes: (fn: (prev: Record<string, number>) => Record<string, number>) => void;
  lang: Lang;
}

export default function FoodSection({
  selectedBoat, boatMenu, boatOptions, cateringOrders, setCateringOrders,
  cateringPartners, cateringMenu, partnerMenus, selectedExtras, toggleExtra,
  expandedSections, toggleSection, customPrices, getPrice, setPrice,
  addMenuItem, updateCateringPersons, adults, children3to11,
  selectedDishes, setSelectedDishes, lang
}: FoodSectionProps) {
  return (
              <div id="food" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#fffbeb', borderRadius: '16px', border: '1px solid #fcd34d' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>🍽️ ПИТАНИЕ</h3>
                
                {/* Included menu sets from partner */}
                {boatMenu.filter(m => m.included && m.from_partner_menu).length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#166534' }}>✅ Включено в стоимость — выберите сеты:</p>
                    {(() => {
                      const menu = partnerMenus.find(pm => pm.partner_id === selectedBoat?.partner_id);
                      return (menu?.conditions_ru || menu?.conditions) ? (
                        <div style={{ marginBottom: '12px', padding: '10px 14px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e' }}>
                          <strong>⚠️ ' + t('pdf.conditions', lang) + '</strong> {menu.conditions_ru || menu.conditions}
                        </div>
                      ) : null;
                    })()}
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {boatMenu.filter(m => m.included && m.from_partner_menu).map(set => {
                        const isSelected = cateringOrders.some(c => String(c.packageId) === String(set.id));
                        const orderIndex = cateringOrders.findIndex(c => String(c.packageId) === String(set.id));
                        const order = orderIndex >= 0 ? cateringOrders[orderIndex] : null;
                        const categoryLabels: Record<string, string> = { thai: '🇹🇭 Тайская', western: '🍝 Западная', vegetarian: '🥗 Вегетарианская', kids: '👶 Детская', seafood: '🦐 Морепродукты', bbq: '🍖 BBQ', other: '🍽️ Другое' };
                        return (
                          <div key={set.id} style={{ padding: '12px 16px', backgroundColor: isSelected ? '#dcfce7' : '#f0fdf4', borderRadius: '10px', border: isSelected ? '2px solid #22c55e' : '1px solid #86efac' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: set.dishes ? '8px' : '0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setCateringOrders(cateringOrders.filter(c => String(c.packageId) !== String(set.id)));
                                    } else {
                                      setCateringOrders([...cateringOrders, { packageId: String(set.id), packageName: set.name_en + (set.name_ru ? ' (' + set.name_ru + ')' : ''), pricePerPerson: 0, persons: adults + children3to11, notes: '' }]);
                                    }
                                  }}
                                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#22c55e' }}
                                />
                                <div>
                                  <span style={{ fontWeight: '600', color: '#166534' }}>{set.name_en}</span>
                                  {set.name_ru && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#15803d' }}>({set.name_ru})</span>}
                                  <span style={{ marginLeft: '10px', padding: '2px 8px', backgroundColor: '#bbf7d0', borderRadius: '4px', fontSize: '11px', color: '#166534' }}>{categoryLabels[set.category || 'other'] || set.category || 'other'}</span>
                                </div>
                              </div>
                              {isSelected && order && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons - 1)} style={{ width: '28px', height: '28px', border: '1px solid #22c55e', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#166534' }}>−</button>
                                  <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '600', color: '#166534' }}>{order.persons} чел</span>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons + 1)} style={{ width: '28px', height: '28px', border: '1px solid #22c55e', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#166534' }}>+</button>
                                </div>
                              )}
                            </div>
                            {set.dishes && set.dishes.length > 0 && (
                              <div style={{ marginLeft: "30px", fontSize: "13px", color: "#15803d", display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                                {set.dishes.map((dish: string, i: number) => {
                                  const isChoice = dish.match(/^Choice of|^Select|^Pick/i);
                                  const dishRu = set.dishes_ru && set.dishes_ru[i] ? set.dishes_ru[i] : "";
                                  const isChoiceRu = dishRu.match(/^На выбор/i);
                                  if (isChoice || isChoiceRu) {
                                    const label = dish.split(":")[0];
                                    const labelRu = dishRu ? dishRu.split(":")[0] : "";
                                    const options = dish.split(":").slice(1).join(":").split(",").map(o => o.trim()).filter(Boolean);
                                    const optionsRu = dishRu ? dishRu.split(":").slice(1).join(":").split(",").map((o: string) => o.trim()).filter(Boolean) : [];
                                    return (
                                      <div key={i} style={{ padding: "10px 14px", backgroundColor: "#fef9c3", borderRadius: "8px", border: "1px solid #fde68a" }}>
                                        <div style={{ fontWeight: "600", marginBottom: "8px", color: "#92400e" }}>{label}{labelRu ? ` (${labelRu})` : ""}:</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                          {options.map((opt, j) => {
                                            const key = set.id + "_" + i + "_" + j;
                                            const count = selectedDishes[key] || 0;
                                            return (
                                              <div key={j} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: "6px", backgroundColor: count > 0 ? "#dcfce7" : "#fefce8" }}>
                                                <span style={{ flex: 1 }}>{opt}{optionsRu[j] ? ` (${optionsRu[j]})` : ""}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
                                                  <button onClick={() => setSelectedDishes(prev => ({...prev, [key]: Math.max(0, (prev[key] || 0) - 1)}))} style={{ width: "26px", height: "26px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontSize: "14px" }}>−</button>
                                                  <span style={{ minWidth: "24px", textAlign: "center", fontWeight: "600" }}>{count}</span>
                                                  <button onClick={() => setSelectedDishes(prev => ({...prev, [key]: (prev[key] || 0) + 1}))} style={{ width: "26px", height: "26px", border: "1px solid #22c55e", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#166534" }}>+</button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                                      <span style={{ color: "#22c55e", marginTop: "2px" }}>•</span>
                                      <span>{dish}{dishRu ? ` (${dishRu})` : ""}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Other included food (non-partner menu) */}
                {(boatOptions.filter(o => o.category_code === 'food' && o.status === 'included').length > 0 || boatMenu.filter(m => m.included && !m.from_partner_menu).length > 0) && (
                  <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: '600', color: '#166534' }}>Также включено: </span>
                    {boatOptions.filter(o => o.category_code === 'food' && o.status === 'included').map((o, i) => (
                      <span key={o.id}>{i > 0 ? ', ' : ''}{o.option_name}</span>
                    ))}
                    {boatMenu.filter(m => m.included && !m.from_partner_menu).map((m, i) => (
                      <span key={m.id}>{(i > 0 || boatOptions.filter(o => o.category_code === 'food' && o.status === 'included').length > 0) ? ', ' : ''}{m.name_en}</span>
                    ))}
                  </div>
                )}

                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#92400e', fontWeight: '500' }}>➕ Хотите улучшить?</p>

                {/* Boat menu options */}
                {boatMenu.filter(m => !m.included).length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#92400e' }}>● Меню с яхты:</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {boatMenu.filter(m => !m.included).map(item => {
                        const isAdded = cateringOrders.some(c => c.packageId === 'menu_' + String(item.id));
                        const orderIndex = cateringOrders.findIndex(c => c.packageId === 'menu_' + String(item.id));
                        const order = orderIndex >= 0 ? cateringOrders[orderIndex] : null;
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#fef3c7' : '#fafafa', borderRadius: '8px', border: isAdded ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={isAdded} 
                                onChange={() => {
                                  if (isAdded) {
                                    setCateringOrders(cateringOrders.filter(c => c.packageId !== 'menu_' + String(item.id)));
                                  } else {
                                    addMenuItem(item);
                                  }
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                              />
                              <span style={{ fontWeight: '500' }}>{item.name_en}</span>
                              {item.name_ru && <span style={{ fontSize: '13px', color: '#6b7280' }}>({item.name_ru})</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {isAdded && order && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons - 1)} style={{ width: '28px', height: '28px', border: '1px solid #d97706', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>−</button>
                                  <span style={{ minWidth: '60px', textAlign: 'center', fontWeight: '600' }}>{order.persons} чел</span>
                                  <button onClick={() => updateCateringPersons(orderIndex, order.persons + 1)} style={{ width: '28px', height: '28px', border: '1px solid #d97706', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="number"
                                  value={getPrice(`menu_${item.id}`, item.price)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPrice(`menu_${item.id}`, val);
                                    if (isAdded && orderIndex >= 0) {
                                      const newOrders = [...cateringOrders];
                                      newOrders[orderIndex] = {...newOrders[orderIndex], pricePerPerson: val};
                                      setCateringOrders(newOrders);
                                    }
                                  }}
                                  style={{ width: '70px', padding: '4px 6px', border: '1px solid #d97706', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px', color: '#d97706' }}
                                />
                                <span style={{ fontWeight: '600', color: '#d97706' }}>THB</span>
                                {isAdded && order && (
                                  <span style={{ marginLeft: '8px', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                                    = {(order.pricePerPerson * order.persons).toLocaleString()} THB
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Boat paid food options */}
                {boatOptions.filter(o => o.category_code === 'food' && o.status === 'paid_optional').length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#92400e' }}>● Дополнительное питание с яхты:</p>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {boatOptions.filter(o => o.category_code === 'food' && o.status === 'paid_optional').map(opt => {
                        const isAdded = selectedExtras.some(e => e.optionId === opt.id);
                        const extra = selectedExtras.find(e => e.optionId === opt.id);
                        return (
                          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#fef3c7' : '#fafafa', borderRadius: '8px', border: isAdded ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={isAdded} 
                                onChange={() => toggleExtra(opt)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                              />
                              <span style={{ fontWeight: '500' }}>{opt.option_name}</span>
                            </div>
                            <span style={{ fontWeight: '600', color: '#d97706' }}>+{opt.price} THB{opt.price_per === 'person' ? '/чел' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Catering partners - Collapsible */}
                {cateringPartners.length > 0 && (
                  <div style={{ borderRadius: '12px', border: '1px solid #e9d5ff', overflow: 'hidden' }}>
                    {/* Header - clickable to expand */}
                    <div 
                      onClick={() => toggleSection('partnerCatering')}
                      style={{ padding: '14px 16px', backgroundColor: '#faf5ff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{expandedSections.partnerCatering ? '▼' : '▶'}</span>
                        <span style={{ fontWeight: '600', color: '#7c3aed' }}>🍽️ Кейтеринг от партнёров</span>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>({cateringPartners.length} партнёров)</span>
                      </div>
                    </div>
                    
                    {/* Content - collapsible */}
                    {expandedSections.partnerCatering && (
                      <div style={{ padding: '16px', backgroundColor: 'white' }}>
                        {cateringPartners.map(partner => (
                          <div key={partner.id} style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                            {/* Partner header with markup slider */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <div>
                                <span style={{ fontWeight: '600', color: '#7c3aed', fontSize: '16px' }}>{partner.name}</span>
                                {partner.description && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>{partner.description}</p>}
                              </div>
                            </div>
                            
                            {/* Menu items */}
                            <div style={{ display: 'grid', gap: '8px' }}>
                              {cateringMenu.filter(m => m.partner_id === partner.id).map(item => {
                                const isAdded = cateringOrders.some(c => c.packageId === 'db_' + String(item.id));
                                const orderIndex = cateringOrders.findIndex(c => c.packageId === 'db_' + String(item.id));
                                const order = orderIndex >= 0 ? cateringOrders[orderIndex] : null;
                                
                                return (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: isAdded ? '#f3e8ff' : 'white', borderRadius: '8px', border: isAdded ? '2px solid #a855f7' : '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isAdded} 
                                        onChange={() => {
                                          if (isAdded) {
                                            setCateringOrders(cateringOrders.filter(c => c.packageId !== 'db_' + String(item.id)));
                                          } else {
                                            // Add with markup applied
                                            const customPrice = customPrices['catering_' + item.id] !== undefined ? customPrices['catering_' + item.id] : item.price_per_person;
                                            setCateringOrders([...cateringOrders, {
                                              packageId: 'db_' + String(item.id),
                                              packageName: item.name_en + ' (' + partner.name + ')',
                                              pricePerPerson: customPrice,
                                              persons: Math.max(adults, item.min_persons),
                                              minPersons: item.min_persons,
                                              notes: ''
                                            }]);
                                          }
                                        }}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                                      />
                                      <div>
                                        <span style={{ fontWeight: '500' }}>{item.name_en}</span>
                                        {item.name_ru && <span style={{ marginLeft: '6px', fontSize: '13px', color: '#6b7280' }}>({item.name_ru})</span>}
                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>мин. {item.min_persons} чел</p>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      {isAdded && order && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <button onClick={() => updateCateringPersons(orderIndex, order.persons - 1)} style={{ width: '28px', height: '28px', border: '1px solid #7c3aed', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>−</button>
                                          <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: '600' }}>{order.persons} чел</span>
                                          <button onClick={() => updateCateringPersons(orderIndex, order.persons + 1)} style={{ width: '28px', height: '28px', border: '1px solid #7c3aed', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                        </div>
                                      )}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                          type="number"
                                          value={getPrice(`catering_${item.id}`, item.price_per_person)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setPrice(`catering_${item.id}`, val);
                                            if (isAdded && orderIndex >= 0) {
                                              const newOrders = [...cateringOrders];
                                              newOrders[orderIndex] = {...newOrders[orderIndex], pricePerPerson: val};
                                              setCateringOrders(newOrders);
                                            }
                                          }}
                                          style={{ width: '70px', padding: '4px 6px', border: '1px solid #7c3aed', borderRadius: '6px', textAlign: 'right', fontWeight: '600', fontSize: '14px', color: '#7c3aed' }}
                                        />
                                        <span style={{ fontWeight: '600', color: '#7c3aed' }}>THB</span>
                                        {isAdded && order && (
                                          <span style={{ marginLeft: '8px', fontWeight: '700', color: '#059669', fontSize: '14px' }}>
                                            = {(order.pricePerPerson * order.persons).toLocaleString()} THB
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {boatMenu.length === 0 && boatOptions.filter(o => o.category_code === 'food').length === 0 && cateringPartners.length === 0 && (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Информация о питании не загружена</p>
                )}
              </div>

  );
}
