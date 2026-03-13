'use client';
import { useCharterStore } from '../store/useCharterStore';
import { SearchResult, BoatOption, SelectedExtra, CateringOrder } from '../lib/types';
import { t, Lang } from '../lib/i18n';

interface BoatMenuItem { id:number; name_en:string; name_ru?:string; category?:string; price:number; included:boolean; from_partner_menu?:boolean; dishes?:string[]; dishes_ru?:string[]; }
interface CateringPartner { id:number; name:string; description?:string; }
interface CateringMenuItem { id:number; partner_id:number; name_en:string; name_ru?:string; price_per_person:number; min_persons:number; }
interface PartnerMenu { partner_id:number; conditions?:string; conditions_ru?:string; }
interface FoodSectionProps {
  selectedBoat:SearchResult|null; boatMenu:BoatMenuItem[]; boatOptions:BoatOption[];
  cateringOrders:CateringOrder[]; setCateringOrders:(o:CateringOrder[])=>void;
  cateringPartners:CateringPartner[]; cateringMenu:CateringMenuItem[]; partnerMenus:PartnerMenu[];
  selectedExtras:SelectedExtra[]; toggleExtra:(o:BoatOption)=>void;
  expandedSections:Record<string,boolean>; toggleSection:(s:string)=>void;
  customPrices:Record<string,number>; getPrice:(k:string,d:number)=>number; setPrice:(k:string,v:number)=>void;
  addMenuItem:(item:any)=>void; updateCateringPersons:(i:number,p:number)=>void;
  adults:number; children3to11:number;
  selectedDishes:Record<string,number>; setSelectedDishes:(fn:(prev:Record<string,number>)=>Record<string,number>)=>void;
  lang:Lang;
}

// ── общие стили строк ──────────────────────────────────────────
const rowGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '6px',
  marginBottom: 14,
};

const row = (active:boolean, activeColor='var(--os-green)'): React.CSSProperties => ({
  display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
  padding:'8px 12px', borderRadius:'var(--r-sm)',
  backgroundColor: active ? `${activeColor}12` : 'var(--os-surface)',
  border:`1.5px solid ${active ? activeColor : 'var(--os-border)'}`,
  transition:'all 0.15s', cursor:'pointer',
});
const ctrBtn: React.CSSProperties = {
  width:24, height:24, border:'1.5px solid var(--os-border)', borderRadius:4,
  backgroundColor:'var(--os-card)', color:'var(--os-text-1)',
  cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
};
const priceInput = (color='var(--os-gold)'): React.CSSProperties => ({
  width:68, padding:'3px 6px', textAlign:'right',
  border:`1.5px solid ${color}`, borderRadius:4,
  backgroundColor:'var(--os-card)', color, fontSize:12, fontWeight:700, outline:'none', flexShrink:0,
});

export default function FoodSection() {
  const {
    selectedBoat, boatMenu = [], boatOptions = [], cateringOrders = [], cateringPartners = [],
    cateringMenu = [], partnerMenus = [], selectedExtras = [], expandedSections = {},
    customPrices = {}, adults = 2, children3to11 = 0, selectedDishes = {},
    lang = 'ru',
    set, getPrice, setPrice, toggleSection,
  } = useCharterStore();

  const setCateringOrders = (v: any) => set({ cateringOrders: typeof v === 'function' ? v(cateringOrders) : v });
  const setSelectedDishes = (v: any) => set({ selectedDishes: typeof v === 'function' ? v(selectedDishes) : v });

  const toggleExtra = (id: any, name: any, price: any) => {
    const exists = selectedExtras.find(e => e.optionId === id);
    if (exists) set({ selectedExtras: selectedExtras.filter(e => e.optionId !== id) });
    else set({ selectedExtras: [...selectedExtras, { optionId: id, name, nameRu: '', quantity: 1, price, pricePer: 'fix', category: 'other' }] });
  };

  const addMenuItem = (partnerId: any, itemId: any, itemName: any, pricePerPerson: any) => {
    const exists = cateringOrders.find(o => o.packageId === String(itemId));
    if (exists) return;
    const persons = adults + children3to11;
    setCateringOrders((prev: any[]) => [...prev, { packageId: String(itemId), packageName: itemName, pricePerPerson, persons, notes: '' }]);
  };

  const updateCateringPersons = (idx: number, val: number) => {
    setCateringOrders((prev: any[]) => prev.map((o, i) => i === idx ? { ...o, persons: val } : o));
  };

  const catLabels: Record<string,string> = { thai:'🇹🇭 Тайская', western:'🍝 Западная', vegetarian:'🥗 Вег.', kids:'👶 Детская', seafood:'🦐 Морепродукты', bbq:'🍖 BBQ', other:'🍽️ Другое' };

  return (
    <div id="food" className="os-section">
      <div className="os-section__title" style={{color:'var(--os-gold)'}}>🍽️ ПИТАНИЕ</div>

      {/* ── Включённые сеты от партнёра ── */}
      {boatMenu.filter(m=>m.included && m.from_partner_menu).length > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--os-green)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>
            ✅ Включено — выберите сеты:
          </div>
          {(() => {
            const menu = partnerMenus.find(pm=>pm.partner_id===selectedBoat?.partner_id);
            return (menu?.conditions_ru||menu?.conditions) ? (
              <div style={{padding:'8px 12px',backgroundColor:'var(--os-surface)',borderRadius:'var(--r-sm)',border:'1px solid rgba(245,158,11,0.2)',fontSize:12,color:'var(--os-gold)',marginBottom:8}}>
                ⚠️ {menu.conditions_ru||menu.conditions}
              </div>
            ) : null;
          })()}
          <div style={rowGrid}>
          {boatMenu.filter(m=>m.included&&m.from_partner_menu).map(set=>{
            const isSelected = cateringOrders.some(c=>String(c.packageId)===String(set.id));
            const orderIndex = cateringOrders.findIndex(c=>String(c.packageId)===String(set.id));
            const order = orderIndex>=0 ? cateringOrders[orderIndex] : null;
            return (
              <div key={set.id} style={row(isSelected,'var(--os-green)')}
                onClick={()=>{
                  if(isSelected){
                    setCateringOrders(cateringOrders.filter(c=>String(c.packageId)!==String(set.id)));
                    if(set.dishes_ru?.length){
                      const next={...selectedDishes};
                      set.dishes_ru.forEach((_:string,i:number)=>delete next[`${String(set.id)}_${i}`]);
                      setSelectedDishes(next);
                    }
                  } else {
                    setCateringOrders([...cateringOrders,{packageId:String(set.id),packageName:set.name_en+(set.name_ru?` (${set.name_ru})`:''),pricePerPerson:0,persons:adults+children3to11,notes:'',dishes:[...(set.dishes_ru||set.dishes||[])]}]);
                  }
                }}>
                <div style={{width:15,height:15,borderRadius:3,flexShrink:0,border:`2px solid ${isSelected?'var(--os-green)':'var(--os-border)'}`,backgroundColor:isSelected?'var(--os-green)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {isSelected&&<span style={{color:'#0C1825',fontSize:9,fontWeight:900}}>✓</span>}
                </div>
                <span style={{flex:1,fontSize:13,fontWeight:600,color:isSelected?'var(--os-text-1)':'var(--os-text-2)',minWidth:'150px'}}>{set.name_en}{set.name_ru&&<span className="os-hide-mobile" style={{fontWeight:400,color:'var(--os-text-3)',fontSize:12}}> ({set.name_ru})</span>}</span>
                <span style={{fontSize:10,padding:'1px 6px',borderRadius:3,backgroundColor:'rgba(34,197,94,0.15)',color:'var(--os-green)',fontWeight:600,flexShrink:0}}>{catLabels[set.category||'other']||set.category}</span>
                {/* Not selected: show dishes as plain text */}
                {!isSelected && set.dishes_ru && set.dishes_ru.length > 0 && (
                  <div style={{width:'100%',fontSize:11,color:'var(--os-text-3)',marginTop:4,lineHeight:'1.5'}}>
                    {set.dishes_ru.join(' · ')}
                  </div>
                )}
                {/* Selected: show per-dish quantity controls */}
                {isSelected && order && set.dishes_ru && set.dishes_ru.length > 0 && (
                  <div style={{width:'100%',marginTop:8,padding:'8px 10px',background:'rgba(0,0,0,0.2)',borderRadius:6,border:'1px solid rgba(34,197,94,0.15)'}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--os-text-3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Порции по блюдам:</div>
                    {set.dishes_ru.map((dish:string, dishIdx:number)=>{
                      const dishKey=`${String(set.id)}_${dishIdx}`;
                      const qty=selectedDishes[dishKey]!==undefined?selectedDishes[dishKey]:order.persons;
                      const updateQty=(newQty:number)=>{
                        const safe=Math.max(0,newQty);
                        const next={...selectedDishes,[dishKey]:safe};
                        setSelectedDishes(next);
                        const updatedDishes=set.dishes_ru!.map((d:string,i:number)=>{
                          const q=next[`${String(set.id)}_${i}`]!==undefined?next[`${String(set.id)}_${i}`]:order.persons;
                          return `${d} ×${q}`;
                        });
                        setCateringOrders(cateringOrders.map((o,idx)=>idx===orderIndex?{...o,dishes:updatedDishes}:o));
                      };
                      return (
                        <div key={dishIdx} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                          <span style={{flex:1,fontSize:11,color:'var(--os-text-2)'}}>{dish}</span>
                          <button style={{...ctrBtn,width:20,height:20}} onClick={()=>updateQty(qty-1)}>−</button>
                          <span style={{minWidth:28,textAlign:'center',fontSize:12,fontWeight:700,color:'var(--os-green)'}}>{qty}</span>
                          <button style={{...ctrBtn,width:20,height:20}} onClick={()=>updateQty(qty+1)}>+</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isSelected&&order&&(
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4}} onClick={e=>e.stopPropagation()}>
                    <span style={{fontSize:10,color:'var(--os-text-3)',marginRight:4}}>Всего:</span>
                    <button style={ctrBtn} onClick={()=>updateCateringPersons(orderIndex,Math.max(1,order.persons-1))}>−</button>
                    <span style={{minWidth:40,textAlign:'center',fontSize:12,fontWeight:700,color:'var(--os-green)'}}>{order.persons} чел</span>
                    <button style={ctrBtn} onClick={()=>updateCateringPersons(orderIndex,order.persons+1)}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* ── Меню с яхты (платное) ── */}
      {boatMenu.filter(m=>!m.included).length > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--os-gold)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>🍽️ Меню с яхты:</div>
          <div style={rowGrid}>
          {boatMenu.filter(m=>!m.included).map(item=>{
            const isAdded = cateringOrders.some(c=>c.packageId===String(item.id));
            const orderIndex = cateringOrders.findIndex(c=>c.packageId===String(item.id));
            const order = orderIndex>=0 ? cateringOrders[orderIndex] : null;
            return (
              <div key={item.id} style={row(isAdded,'var(--os-gold)')}
                onClick={()=>{ if(isAdded){setCateringOrders(cateringOrders.filter(c=>c.packageId!==String(item.id)));} else{ const persons = adults + children3to11; setCateringOrders((prev: any[]) => [...prev, { packageId: String(item.id), packageName: (item.name_en || item.name_ru || '') + (item.name_ru && item.name_en ? ` (${item.name_ru})` : ''), pricePerPerson: item.price || 0, persons, notes: '', dishes: [...(item.dishes_ru || item.dishes || [])] }]); } }}>
                <div style={{width:15,height:15,borderRadius:3,flexShrink:0,border:`2px solid ${isAdded?'var(--os-gold)':'var(--os-border)'}`,backgroundColor:isAdded?'var(--os-gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {isAdded&&<span style={{color:'#0C1825',fontSize:9,fontWeight:900}}>✓</span>}
                </div>
                <span style={{flex:1,fontSize:13,fontWeight:500,color:'var(--os-text-1)',minWidth:'150px'}}>{item.name_en}{item.name_ru&&<span className="os-hide-mobile" style={{color:'var(--os-text-3)',fontSize:12}}> ({item.name_ru})</span>}
                  {item.dishes_ru && item.dishes_ru.length > 0 && (
                    <div style={{fontSize:11,color:'var(--os-text-3)',marginTop:2,lineHeight:'1.4'}}>{item.dishes_ru.join(' · ')}</div>
                  )}
                </span>
                {isAdded&&order&&(
                  <div style={{display:'flex',alignItems:'center',gap:4}} onClick={e=>e.stopPropagation()}>
                    <button style={ctrBtn} onClick={()=>updateCateringPersons(orderIndex,Math.max(1,order.persons-1))}>−</button>
                    <span style={{minWidth:40,textAlign:'center',fontSize:12,fontWeight:700}}>{order.persons} {item.price_unit==='person'?'чел':'шт'}</span>
                    <button style={ctrBtn} onClick={()=>updateCateringPersons(orderIndex,order.persons+1)}>+</button>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:4}} onClick={e=>e.stopPropagation()}>
                  <input type="number" value={getPrice(`menu_${item.id}`,item.price)}
                    onChange={e=>{const v=Number(e.target.value);setPrice(`menu_${item.id}`,v);if(isAdded&&orderIndex>=0){const o=[...cateringOrders];o[orderIndex]={...o[orderIndex],pricePerPerson:v};setCateringOrders(o);}}}
                    style={priceInput('var(--os-gold)')} />
                  <span style={{fontSize:11,color:'var(--os-gold)',fontWeight:600}}>THB</span>
                  {isAdded&&order&&<span style={{fontSize:11,fontWeight:700,color:'var(--os-green)',minWidth:60,textAlign:'right'}}>={( order.pricePerPerson*order.persons).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* ── Платные опции с яхты ── */}
      {boatOptions.filter(o=>o.category_code==='food'&&o.status==='paid_optional').length > 0 && (
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--os-gold)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>➕ Доп. питание с яхты:</div>
          <div style={rowGrid}>
          {boatOptions.filter(o=>o.category_code==='food'&&o.status==='paid_optional').map(opt=>{
            const isAdded = selectedExtras.some(e=>e.optionId===opt.id);
            return (
              <div key={opt.id} style={row(isAdded,'var(--os-gold)')} onClick={()=>toggleExtra(opt.id, opt.option_name, opt.price || 0)}>
                <div style={{width:15,height:15,borderRadius:3,flexShrink:0,border:`2px solid ${isAdded?'var(--os-gold)':'var(--os-border)'}`,backgroundColor:isAdded?'var(--os-gold)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {isAdded&&<span style={{color:'#0C1825',fontSize:9,fontWeight:900}}>✓</span>}
                </div>
                <span style={{flex:1,fontSize:13,fontWeight:500,color:'var(--os-text-1)',minWidth:'150px'}}>{opt.option_name}</span>
                <span style={{fontSize:12,fontWeight:700,color:'var(--os-gold)',flexShrink:0}}>+{opt.price} THB{opt.price_per==='person'?'/чел':''}</span>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* ── Кейтеринг от партнёров ── */}
      {cateringPartners.length > 0 && (
        <div style={{border:'1px solid var(--os-border)',borderRadius:'var(--r-md)',overflow:'hidden'}}>
          <div onClick={()=>toggleSection('partnerCatering')}
            style={{padding:'10px 14px',backgroundColor:'var(--os-surface)',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:12,color:'var(--os-text-3)'}}>{expandedSections.partnerCatering?'▼':'▶'}</span>
            <span style={{fontWeight:700,color:'var(--os-purple)',fontSize:13}}>🍽️ Кейтеринг от партнёров</span>
            <span style={{fontSize:11,color:'var(--os-text-3)'}}>({cateringPartners.length} партнёров)</span>
          </div>
          {expandedSections.partnerCatering && (
            <div style={{padding:'12px 14px',backgroundColor:'var(--os-card)'}}>
              {cateringPartners.map(partner=>(
                <div key={partner.id} style={{marginBottom:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--os-purple)',marginBottom:4}}>{partner.name}</div>
                  {partner.description&&<div style={{fontSize:11,color:'var(--os-text-3)',marginBottom:8}}>{partner.description}</div>}
                  <div style={rowGrid}>
                  {cateringMenu.filter(m=>m.partner_id===partner.id).map(item=>{
                    const isAdded = cateringOrders.some(c=>c.packageId==='db_'+String(item.id));
                    const orderIndex = cateringOrders.findIndex(c=>c.packageId==='db_'+String(item.id));
                    const order = orderIndex>=0 ? cateringOrders[orderIndex] : null;
                    return (
                      <div key={item.id} style={row(isAdded,'var(--os-purple)')}
                        onClick={()=>{ if(isAdded){setCateringOrders(cateringOrders.filter(c=>c.packageId!=='db_'+String(item.id)));}
                          else{const cp=customPrices['catering_'+item.id]!==undefined?customPrices['catering_'+item.id]:item.price_per_person;setCateringOrders([...cateringOrders,{packageId:'db_'+String(item.id),packageName:item.name_en+' ('+partner.name+')',pricePerPerson:cp,persons:Math.max(adults,item.min_persons),minPersons:item.min_persons,notes:''}]);} }}>
                        <div style={{width:15,height:15,borderRadius:3,flexShrink:0,border:`2px solid ${isAdded?'var(--os-purple)':'var(--os-border)'}`,backgroundColor:isAdded?'var(--os-purple)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {isAdded&&<span style={{color:'#0C1825',fontSize:9,fontWeight:900}}>✓</span>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:500,color:'var(--os-text-1)'}}>{item.name_en}{item.name_ru&&<span className="os-hide-mobile" style={{color:'var(--os-text-3)',fontSize:11}}> ({item.name_ru})</span>}</div>
                          <div className="os-hide-mobile" style={{fontSize:10,color:'var(--os-text-3)'}}>мин. {item.min_persons} чел</div>
                        </div>
                        {isAdded&&order&&(
                          <div style={{display:'flex',alignItems:'center',gap:4}} onClick={e=>e.stopPropagation()}>
                            <button style={ctrBtn} onClick={()=>updateCateringPersons(orderIndex,order.persons-1)}>−</button>
                            <span style={{minWidth:40,textAlign:'center',fontSize:12,fontWeight:700}}>{order.persons}чел</span>
                            <button style={ctrBtn} onClick={()=>updateCateringPersons(orderIndex,order.persons+1)}>+</button>
                          </div>
                        )}
                        <div style={{display:'flex',alignItems:'center',gap:4}} onClick={e=>e.stopPropagation()}>
                          <input type="number" value={getPrice(`catering_${item.id}`,item.price_per_person)}
                            onChange={e=>{const v=Number(e.target.value);setPrice(`catering_${item.id}`,v);if(isAdded&&orderIndex>=0){const o=[...cateringOrders];o[orderIndex]={...o[orderIndex],pricePerPerson:v};setCateringOrders(o);}}}
                            style={priceInput('var(--os-purple)')} />
                          <span style={{fontSize:11,color:'var(--os-purple)',fontWeight:600}}>THB</span>
                          {isAdded&&order&&<span style={{fontSize:11,fontWeight:700,color:'var(--os-green)',minWidth:60,textAlign:'right'}}>={(order.pricePerPerson*order.persons).toLocaleString()}</span>}
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

      {boatMenu.length===0&&boatOptions.filter(o=>o.category_code==='food').length===0&&cateringPartners.length===0&&(
        <p style={{color:'var(--os-text-3)',fontStyle:'italic',fontSize:13}}>Информация о питании не загружена</p>
      )}
    </div>
  );
}
