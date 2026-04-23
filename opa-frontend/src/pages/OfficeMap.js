import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useDarkMode } from '../context/DarkModeContext';

const mockOfficeDetails = {
  AS139: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Ayse Kaya'] },
  AS140: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Mehmet Yilmaz', 'Dr. Elif Demir'] },
  AS111: { occupants: 0, capacity: 2, status: 'available',    people: [] },
  AS112: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Selin Arslan'] },
  AS113: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Hasan Celik', 'Dr. Mert Koc'] },
  AS114: { occupants: 1, capacity: 1, status: 'occupied',     people: ['Dr. Can Ozturk'] },
  AS115: { occupants: 0, capacity: 2, status: 'available',    people: [] },
  AS116: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Zeynep Sahin'] },
  AS117: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Ali Yilmaz', 'Dr. Fatma Kurt'] },
  AS118: { occupants: 3, capacity: 2, status: 'overcapacity', people: ['Dr. Ahmet Demir', 'Prof. Selin Kaya', 'Dr. Murat Oz'] },
  AS119: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Elif Celik'] },
  AS120: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Mehmet Arslan', 'Dr. Ayse Yildiz'] },
  AS121: { occupants: 0, capacity: 2, status: 'available',    people: [] },
  AS122: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Can Kaya'] },
  AS123: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Zeynep Demir', 'Dr. Ali Koc'] },
  AS123A:{ occupants: 0, capacity: 1, status: 'available',    people: [] },
  AS124: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Hasan Yilmaz'] },
  AS125: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Fatma Arslan', 'Dr. Mert Celik'] },
  AS126: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Selin Ozturk'] },
  AS127: { occupants: 0, capacity: 2, status: 'available',    people: [] },
  AS128: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Ahmet Kaya'] },
  AS129: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Elif Yilmaz', 'Dr. Can Demir'] },
  AS130: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Murat Arslan'] },
  AS131: { occupants: 0, capacity: 2, status: 'available',    people: [] },
  AS132: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Zeynep Koc', 'Dr. Ali Celik'] },
  AS133: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Fatma Yildiz'] },
  AS134: { occupants: 3, capacity: 2, status: 'overcapacity', people: ['Prof. Hasan Kaya', 'Dr. Selin Demir', 'Dr. Mert Yilmaz'] },
  AS135: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Ayse Arslan'] },
  AS136: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Can Ozturk', 'Dr. Zeynep Kurt'] },
  AS137: { occupants: 0, capacity: 2, status: 'available',    people: [] },
  AS138: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Elif Koc'] },
  AS144: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Ahmet Celik', 'Dr. Murat Yildiz'] },
  AS141: { occupants: 1, capacity: 2, status: 'available',    people: ['Dr. Fatma Kaya'] },
  AS142: { occupants: 2, capacity: 2, status: 'occupied',     people: ['Prof. Hasan Arslan', 'Dr. Selin Kurt'] },
  AS143: { occupants: 0, capacity: 1, status: 'available',    people: [] },
};

const STATUS = {
  available:    { fill: '#10B981', fillOp: 0.22, stroke: '#059669', label: 'Available',     text: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
  occupied:     { fill: '#3B82F6', fillOp: 0.22, stroke: '#1D4ED8', label: 'Occupied',      text: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
  overcapacity: { fill: '#F59E0B', fillOp: 0.38, stroke: '#D97706', label: 'Over Capacity', text: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  unknown:      { fill: '#94A3B8', fillOp: 0.12, stroke: '#94A3B8', label: 'No Data',       text: '#94A3B8', bg: '#F1F5F9', border: '#CBD5E1' },
};

const AVATAR_COLORS = ['#2563EB', '#059669', '#7C3AED', '#B45309', '#0891B2', '#DC2626'];

function useOfficeStyle(id, selectedOffice) {
  const detail = mockOfficeDetails[id];
  const st     = detail ? STATUS[detail.status] : STATUS.unknown;
  const isSel  = selectedOffice === id;
  return {
    rectProps: {
      fill: st.fill,
      fillOpacity: isSel ? Math.min(st.fillOp * 2.5, 0.88) : st.fillOp,
      stroke: isSel ? st.stroke : st.stroke,
      strokeWidth: isSel ? 2.5 : 1.4,
      cursor: 'pointer',
      rx: 4,
      filter: isSel ? 'drop-shadow(0 0 4px rgba(0,0,0,0.25))' : 'none',
    },
    textColor: isSel ? st.stroke : st.text,
  };
}

function OfficeRoom({ id, x, y, w, h, selectedOffice, onOfficeClick, fontSize = 8 }) {
  const { rectProps, textColor } = useOfficeStyle(id, selectedOffice);
  return (
    <g onClick={e => onOfficeClick(id, e)} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={h} {...rectProps} />
      <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize} fill={textColor} fontFamily="Nunito,sans-serif" fontWeight="800"
        style={{ pointerEvents: 'none', userSelect: 'none' }}>{id}</text>
    </g>
  );
}

function Room({ label, x, y, w, h, fill, textFill, fontSize = 8.5, darkMode }) {
  const bg = fill || (darkMode ? 'rgba(255,255,255,0.04)' : '#E8F0FA');
  const tf = textFill || (darkMode ? '#4A7FAA' : '#5A87B8');
  const sb = darkMode ? '#2A4A6A' : '#B8CCE0';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={bg} stroke={sb} strokeWidth="1" rx="3"/>
      <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize} fill={tf} fontFamily="Nunito,sans-serif" fontWeight="600"
        style={{ userSelect: 'none' }}>{label}</text>
    </g>
  );
}

function FloorZemin({ onOfficeClick, selectedOffice, darkMode }) {
  const wc  = darkMode ? '#2A4A6A' : '#B8CCE0';
  const cor = darkMode ? '#0A1E36' : '#EEF4FB';
  return (
    <svg width="100%" viewBox="0 0 420 600" style={{ display: 'block' }}>
      <rect x="8" y="8" width="404" height="584" rx="8" fill={cor} stroke={wc} strokeWidth="2"/>
      <Room label="General Accounting" x={16} y={16} w={150} h={44} darkMode={darkMode} fontSize={7.5}/>
      <Room label="CR128" x={16} y={62} w={150} h={80} darkMode={darkMode}/>
      <Room label="CR127" x={16} y={144} w={150} h={80} darkMode={darkMode}/>
      <Room label="CR126" x={16} y={226} w={150} h={80} darkMode={darkMode}/>
      <Room label="CR125" x={16} y={308} w={150} h={80} darkMode={darkMode}/>
      <Room label="CR124" x={16} y={390} w={150} h={80} darkMode={darkMode}/>
      <OfficeRoom id="AS139" x={168} y={16} w={58} h={44} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick}/>
      <OfficeRoom id="AS140" x={228} y={16} w={58} h={44} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick}/>
      <Room label="CR120" x={288} y={16} w={124} h={80} darkMode={darkMode}/>
      <Room label="CR121" x={288} y={98} w={124} h={80} darkMode={darkMode}/>
      <Room label="CR122" x={288} y={180} w={124} h={80} darkMode={darkMode}/>
      <Room label="CR123" x={288} y={262} w={124} h={80} darkMode={darkMode}/>
      <Room label="Final Cafe" x={288} y={344} w={124} h={65} fill={darkMode ? 'rgba(254,243,199,0.15)' : '#FEF9C3'} textFill={darkMode ? '#FCD34D' : '#92400E'} darkMode={darkMode}/>
      <Room label="CR129" x={168} y={62} w={118} h={80} darkMode={darkMode}/>
      <rect x={168} y={144} width={118} height={130} fill={cor} stroke={wc} strokeWidth="0.8" strokeDasharray="4,3" rx="3"/>
      <text x={227} y={212} textAnchor="middle" fontSize={8} fill={darkMode ? '#2A4A6A' : '#A8C0D8'} fontFamily="Nunito,sans-serif">Open Gallery</text>
      <Room label="Storage" x={168} y={276} w={118} h={55} darkMode={darkMode} fontSize={7.5}/>
      <Room label="Dentistry Clinic" x={168} y={333} w={118} h={55} darkMode={darkMode} fontSize={7.5}/>
      <rect x={16} y={472} width={150} height={108} fill={cor} stroke={wc} strokeWidth="1" rx="3"/>
      <text x={91} y={530} textAnchor="middle" fontSize={10} fill={darkMode ? '#C8DCF0' : '#1E4A7A'} fontFamily="Nunito,sans-serif" fontWeight="800">ENTRANCE / GİRİŞ</text>
      <Room label="Kitchen" x={288} y={411} w={80} h={55} fill={darkMode ? 'rgba(207,250,254,0.12)' : '#CFFAFE'} textFill={darkMode ? '#67E8F9' : '#164E63'} darkMode={darkMode}/>
      <Room label="Uni. Bus Station" x={370} y={411} w={38} h={165} darkMode={darkMode} fontSize={6.5}/>
      {[0,1,2,3,4,5].map(i => (
        <Room key={i} label="Secretary" x={168} y={390 + i * 32} w={118} h={30} darkMode={darkMode} fontSize={7}/>
      ))}
      <circle cx="28" cy="578" r="14" fill="#1D4ED8"/>
      <text x="28" y="583" textAnchor="middle" fontSize="11" fill="white" fontFamily="Nunito,sans-serif" fontWeight="900">0</text>
    </svg>
  );
}

function Floor1({ onOfficeClick, selectedOffice, darkMode }) {
  const wc  = darkMode ? '#2A4A6A' : '#B8CCE0';
  const cor = darkMode ? '#0A1E36' : '#EEF4FB';
  const rh = 28, gap = 2, step = rh + gap;
  const ly0 = 396, lx = 16, mlx = 78, kor = 140, mrx = 210, rx2 = 272;
  const leftIds = ['AS122','AS121','AS120','AS119','AS118','AS117','AS116','AS115','AS114','AS113','AS112','AS111'];
  const midLIds = ['AS123','AS124','AS127','AS125','AS126'];
  const midRIds = ['AS128','AS129','AS130','AS131','AS132','AS133'];
  return (
    <svg width="100%" viewBox="0 0 340 890" style={{ display: 'block' }}>
      <rect x="4" y="4" width="332" height="882" rx="8" fill={cor} stroke={wc} strokeWidth="2"/>
      <OfficeRoom id="AS144" x={12} y={12} w={52} h={26} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      <Room label="Nursing Lab" x={68} y={12} w={110} h={46} darkMode={darkMode} fontSize={7}/>
      <Room label="CR132" x={182} y={12} w={154} h={46} darkMode={darkMode}/>
      <Room label="CR136" x={12} y={40} w={52} h={64} darkMode={darkMode}/>
      <Room label="CR135" x={12} y={106} w={52} h={64} darkMode={darkMode}/>
      <Room label="CR134" x={12} y={172} w={52} h={64} darkMode={darkMode}/>
      <Room label="CR130" x={182} y={60} w={154} h={64} darkMode={darkMode}/>
      <Room label="CR131" x={182} y={126} w={154} h={64} darkMode={darkMode}/>
      <Room label="WC" x={250} y={192} w={58} h={28} darkMode={darkMode} fontSize={8}/>
      <Room label="WC" x={250} y={222} w={58} h={28} darkMode={darkMode} fontSize={8}/>
      <rect x={68} y={60} width={110} height={148} fill={cor} stroke={wc} strokeWidth="0.8" strokeDasharray="4,3" rx="3"/>
      <text x={123} y={137} textAnchor="middle" fontSize={7.5} fill={darkMode ? '#2A4A6A' : '#A8C0D8'} fontFamily="Nunito,sans-serif">Open Gallery</text>
      <Room label="Conference Hall II" x={12} y={238} w={52} h={108} fill={darkMode ? 'rgba(127,29,29,0.4)' : '#7F1D1D'} textFill="white" darkMode={darkMode} fontSize={6}/>
      <Room label="Kitchen" x={68} y={192} w={58} h={28} fill={darkMode ? 'rgba(207,250,254,0.12)' : '#CFFAFE'} textFill={darkMode ? '#67E8F9' : '#164E63'} darkMode={darkMode} fontSize={7}/>
      <Room label="Board of Trustees" x={68} y={222} w={58} h={28} darkMode={darkMode} fontSize={5.5}/>
      <Room label="Guidance" x={68} y={252} w={58} h={28} darkMode={darkMode} fontSize={6}/>
      <Room label="Academic Coord." x={68} y={282} w={58} h={28} darkMode={darkMode} fontSize={5.5}/>
      <OfficeRoom id="AS123A" x={68}  y={314} w={58} h={26} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7}/>
      <OfficeRoom id="AS136"  x={130} y={314} w={76} h={26} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      <OfficeRoom id="AS138"  x={210} y={300} w={58} h={26} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      <OfficeRoom id="AS137"  x={272} y={300} w={58} h={26} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      {leftIds.map((id, i) => (
        <OfficeRoom key={id} id={id} x={lx}  y={ly0 + i*step} w={58} h={rh} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      ))}
      {midLIds.map((id, i) => (
        <OfficeRoom key={id} id={id} x={mlx} y={ly0 + i*step} w={58} h={rh} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      ))}
      <rect x={kor} y={ly0} width={66} height={5*step+rh} fill={cor} stroke={wc} strokeWidth="0.8" strokeDasharray="3,2" rx="2"/>
      {midRIds.map((id, i) => (
        <OfficeRoom key={id} id={id} x={mrx} y={ly0 + i*step} w={58} h={rh} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      ))}
      <OfficeRoom id="AS135" x={rx2} y={ly0 + 2*step} w={58} h={rh} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      <OfficeRoom id="AS134" x={rx2} y={ly0 + 3*step} w={58} h={rh} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick} fontSize={7.5}/>
      <Room label="IT Centre" x={mrx} y={ly0 + 6*step + 2} w={58} h={rh} fill={darkMode ? 'rgba(220,252,231,0.1)' : '#DCFCE7'} textFill={darkMode ? '#4ADE80' : '#166534'} darkMode={darkMode} fontSize={7}/>
      <rect x={kor} y={ly0 + 6*step + 32} width={66} height={90} fill={cor} stroke={wc} strokeWidth="0.8" strokeDasharray="3,2" rx="2"/>
      <text x={kor+33} y={ly0 + 6*step + 80} textAnchor="middle" fontSize={7} fill={darkMode ? '#2A4A6A' : '#A8C0D8'} fontFamily="Nunito,sans-serif">Open Gallery</text>
      <Room label="WC" x={mrx} y={ly0 + 7*step} w={58} h={rh} darkMode={darkMode} fontSize={8}/>
      <Room label="WC" x={mrx} y={ly0 + 8*step} w={58} h={rh} darkMode={darkMode} fontSize={8}/>
      <Room label="Stairs" x={kor} y={ly0 + 12*step} w={66} h={44} darkMode={darkMode} fontSize={7.5}/>
      <circle cx="24" cy="874" r="13" fill="#1D4ED8"/>
      <text x="24" y="879" textAnchor="middle" fontSize="9" fill="white" fontFamily="Nunito,sans-serif" fontWeight="900">+1</text>
    </svg>
  );
}

function Floor2({ onOfficeClick, selectedOffice, darkMode }) {
  const wc  = darkMode ? '#2A4A6A' : '#B8CCE0';
  const cor = darkMode ? '#0A1E36' : '#EEF4FB';
  const adm = darkMode ? 'rgba(109,40,217,0.12)' : '#EDE9FE';
  const topRooms = [
    ['CR145',10,10,82,58],['CR146',94,10,82,58],['CR146A',178,10,82,58],['CR145A',262,10,150,58],
    ['CR144',10,70,82,68],['CR147',94,70,82,68],['CR147A',178,70,82,68],['CR144A',262,70,150,68],
    ['CR143',10,140,82,68],['CR143A',262,140,150,68],
    ['CR142',10,210,82,68],['CR148A',178,210,82,68],['CR142A',262,210,150,68],
    ['CR141',10,280,82,68],['CR140A',262,280,150,68],
    ['CR140',10,350,82,68],
  ];
  return (
    <svg width="100%" viewBox="0 0 420 720" style={{ display: 'block' }}>
      <rect x="8" y="8" width="404" height="704" rx="8" fill={cor} stroke={wc} strokeWidth="2"/>
      {topRooms.map(([l,x,y,rw,rh]) => (
        <Room key={l} label={l} x={x} y={y} w={rw} h={rh} darkMode={darkMode}/>
      ))}
      <rect x={94} y={140} width={166} height={150} fill={cor} stroke={wc} strokeWidth="0.8" strokeDasharray="4,3" rx="3"/>
      <text x={177} y={218} textAnchor="middle" fontSize={8.5} fill={darkMode ? '#2A4A6A' : '#A8C0D8'} fontFamily="Nunito,sans-serif">Open Gallery</text>
      <Room label="Storage" x={178} y={280} w={82} h={40} darkMode={darkMode} fontSize={7.5}/>
      <Room label="WC" x={178} y={322} w={40} h={32} darkMode={darkMode} fontSize={8}/>
      <Room label="WC" x={178} y={356} w={40} h={32} darkMode={darkMode} fontSize={8}/>
      <rect x={94} y={420} width={318} height={70} fill={darkMode ? 'rgba(240,253,244,0.06)' : '#F0FDF4'} stroke="#16A34A" strokeWidth="1" rx="4" strokeDasharray="5,3"/>
      <text x={253} y={458} textAnchor="middle" fontSize={10} fill={darkMode ? '#4ADE80' : '#166534'} fontFamily="Nunito,sans-serif" fontWeight="700">TERRACE / TERAS</text>
      <rect x={94} y={492} width={318} height={200} rx="5" fill={adm} stroke={darkMode ? '#7C3AED' : '#A78BFA'} strokeWidth="1.2"/>
      <text x={253} y={512} textAnchor="middle" fontSize={7.5} fill={darkMode ? '#C4B5FD' : '#5B21B6'} fontFamily="Nunito,sans-serif" fontWeight="700">University Administration / Üniversite Yönetimi</text>
      <OfficeRoom id="AS141" x={250} y={520} w={154} h={36} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick}/>
      <OfficeRoom id="AS142" x={250} y={560} w={154} h={36} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick}/>
      <OfficeRoom id="AS143" x={250} y={600} w={154} h={36} selectedOffice={selectedOffice} onOfficeClick={onOfficeClick}/>
      <Room label="Senate" x={100} y={520} w={80} h={45} darkMode={darkMode} fontSize={7.5}/>
      <Room label="General Secretary" x={100} y={567} w={80} h={40} darkMode={darkMode} fontSize={6.5}/>
      <Room label="Board of Trustees" x={100} y={609} w={80} h={40} darkMode={darkMode} fontSize={6.5}/>
      <Room label="Rector Office" x={184} y={520} w={62} h={40} darkMode={darkMode} fontSize={7}/>
      <Room label="Vice Rector" x={184} y={562} w={62} h={40} darkMode={darkMode} fontSize={7}/>
      <Room label="Deputy Gen. Sec." x={184} y={604} w={62} h={45} darkMode={darkMode} fontSize={6.5}/>
      <Room label="Kitchen" x={10} y={492} w={50} h={40} fill={darkMode ? 'rgba(207,250,254,0.12)' : '#CFFAFE'} textFill={darkMode ? '#67E8F9' : '#164E63'} darkMode={darkMode} fontSize={7}/>
      <rect x={10} y={534} width={82} height={158} fill={cor} stroke={wc} strokeWidth="0.8" strokeDasharray="4,2" rx="2"/>
      <text x={51} y={616} textAnchor="middle" fontSize={7} fill={darkMode ? '#2A4A6A' : '#A8C0D8'} fontFamily="Nunito,sans-serif" transform="rotate(-90,51,616)">Open Gallery</text>
      <circle cx="28" cy="700" r="14" fill="#1D4ED8"/>
      <text x="28" y="705" textAnchor="middle" fontSize="10" fill="white" fontFamily="Nunito,sans-serif" fontWeight="900">+2</text>
    </svg>
  );
}

function FloorMinus1({ darkMode }) {
  const wc  = darkMode ? '#2A4A6A' : '#B8CCE0';
  const cor = darkMode ? '#0A1E36' : '#EEF4FB';
  const rooms = [
    ['Dining Hall / Yemekhane',16,16,180,95,'#FEF9C3','#92400E'],
    ['Cafeteria',200,16,110,65,'#FEF9C3','#92400E'],
    ['Kitchen',314,16,98,65,'#CFFAFE','#164E63'],
    ['Conference Hall I',16,113,148,95,'#7F1D1D','white'],
    ['Computer Lab III',16,210,148,68,null,null],
    ['Library',16,280,148,110,'#FEE2E2','#991B1B'],
    ['Computer Lab I',16,392,148,68,null,null],
    ['Computer Lab II',16,462,148,68,null,null],
    ['Circuit & Electronics Lab',16,532,148,68,null,null],
    ['PCR Lab / Chemistry',16,602,148,68,null,null],
    ['Physics Lab',16,672,72,68,null,null],
    ['E.Library',90,672,74,68,'#FEE2E2','#991B1B'],
    ['CR101',200,83,212,68,null,null],
    ['CR102',200,153,212,68,null,null],
    ['CR103',200,223,212,60,null,null],
    ['CR104 Pilates Room',200,285,212,60,null,null],
    ['CR105',200,347,212,50,null,null],
    ['CR106',200,399,212,50,null,null],
    ['CR107',200,451,212,50,null,null],
    ['CR108',200,503,212,50,null,null],
    ['CR109',200,555,212,50,null,null],
    ['CR110',200,607,212,50,null,null],
    ['CR111',200,659,212,40,null,null],
    ['CR112',200,701,212,40,null,null],
    ['Drama',200,743,212,40,null,null],
    ['CR115',16,752,50,48,null,null],
    ['CR116',68,752,50,48,null,null],
    ['CR117',120,752,44,48,null,null],
    ['Dry Storage',200,785,212,40,null,null],
    ['Game Room',16,83,148,28,null,null],
  ];
  return (
    <svg width="100%" viewBox="0 0 420 830" style={{ display: 'block' }}>
      <rect x="8" y="8" width="404" height="814" rx="8" fill={cor} stroke={wc} strokeWidth="2"/>
      {rooms.map(([label, x, y, rw, rh, bg, tc]) => (
        <Room key={label+x+y} label={label} x={x} y={y} w={rw} h={rh}
          fill={bg ? (darkMode && bg !== 'white' ? bg + '33' : bg) : null}
          textFill={tc || null} darkMode={darkMode} fontSize={rw < 80 ? 6.5 : 8}/>
      ))}
      <rect x={166} y={280} width={32} height={292} fill={cor} stroke={wc} strokeWidth="0.5" strokeDasharray="4,2" rx="2"/>
      <text x={182} y={428} textAnchor="middle" fontSize={7} fill={darkMode ? '#2A4A6A' : '#A8C0D8'} fontFamily="Nunito,sans-serif" transform="rotate(-90,182,428)">Open Gallery</text>
      <rect x={166} y={662} width={32} height={58} fill={darkMode ? 'rgba(220,252,231,0.12)' : '#DCFCE7'} stroke="#16A34A" strokeWidth="1" rx="2"/>
      <text x={182} y={694} textAnchor="middle" fontSize={7} fill={darkMode ? '#4ADE80' : '#166534'} fontFamily="Nunito,sans-serif">Green</text>
      <circle cx="28" cy="810" r="14" fill="#1D4ED8"/>
      <text x="28" y="815" textAnchor="middle" fontSize="10" fill="white" fontFamily="Nunito,sans-serif" fontWeight="900">-1</text>
    </svg>
  );
}

export default function OfficeMap() {
  const { darkMode } = useDarkMode();
  const [selectedFloor,  setSelectedFloor]  = useState('1');
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [popupData,      setPopupData]      = useState(null);

  const t = darkMode ? {
    surface:    '#0D2640',
    surface2:   '#0A1E36',
    border:     'rgba(255,255,255,0.07)',
    title:      '#E8F4FF',
    text:       '#C8DCF0',
    sub:        '#4A7FAA',
    eyebrow:    '#4A7FAA',
    floorBtnBg: 'rgba(255,255,255,0.06)',
    floorBtnColor: '#4A7FAA',
  } : {
    surface:    '#fff',
    surface2:   '#F5F9FF',
    border:     '#C2D8EF',
    title:      '#0D2D52',
    text:       '#1E4A7A',
    sub:        '#7AAAD0',
    eyebrow:    '#5A87B8',
    floorBtnBg: '#EEF4FB',
    floorBtnColor: '#5A87B8',
  };

  const card = {
    backgroundColor: t.surface,
    borderRadius: '16px',
    border: `1.5px solid ${t.border}`,
    boxShadow: darkMode ? 'none' : '0 2px 12px rgba(15,60,120,0.07)',
  };

  const floors = [
    { key: '-1', label: '-1st Floor' },
    { key: '0',  label: 'Ground'     },
    { key: '1',  label: '1st Floor'  },
    { key: '2',  label: '2nd Floor'  },
  ];

  const handleOfficeClick = (id, e) => {
    if (id === selectedOffice) { setSelectedOffice(null); setPopupData(null); return; }
    const svgEl = e.currentTarget.closest('svg');
    const rect  = svgEl ? svgEl.getBoundingClientRect() : { left: 0, top: 0 };
    setSelectedOffice(id);
    setPopupData({ id, detail: mockOfficeDetails[id], x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const statusInfo = popupData?.detail ? STATUS[popupData.detail.status] : null;

  // Summary counts
  const allDetails = Object.values(mockOfficeDetails);
  const counts = {
    available:    allDetails.filter(d => d.status === 'available').length,
    occupied:     allDetails.filter(d => d.status === 'occupied').length,
    overcapacity: allDetails.filter(d => d.status === 'overcapacity').length,
  };

  return (
    <Layout>
      <div style={{ fontFamily: "'Nunito', 'Sora', sans-serif", display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: t.eyebrow, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '5px' }}>Visualization</div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: t.title, letterSpacing: '-1px', lineHeight: 1, margin: 0 }}>Office Map</h1>
          </div>
          {/* Legend chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(STATUS).filter(([k]) => k !== 'unknown').map(([key, val]) => (
              <div key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '22px', background: val.bg, border: `1.5px solid ${val.border}`, fontSize: '12px', fontWeight: 700, color: val.text }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: val.fill, display: 'inline-block', flexShrink: 0 }} />
                {counts[key]} {val.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Floor selector + Map ── */}
        <div style={card}>
          {/* Topbar */}
          <div style={{ padding: '14px 22px', borderBottom: `1.5px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.surface2, borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {floors.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setSelectedFloor(f.key); setSelectedOffice(null); setPopupData(null); }}
                  style={{
                    padding: '7px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '13px', fontWeight: 700,
                    backgroundColor: selectedFloor === f.key ? '#1D4ED8' : t.floorBtnBg,
                    color: selectedFloor === f.key ? '#fff' : t.floorBtnColor,
                    transition: 'all .15s',
                    boxShadow: selectedFloor === f.key ? '0 2px 8px rgba(29,78,216,0.3)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {selectedFloor !== '-1' && (
              <span style={{ fontSize: '12px', color: t.sub, fontWeight: 600 }}>
                Click on a colored office to view details
              </span>
            )}
          </div>

          {/* Map area */}
          <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto', padding: '24px 20px' }}>
            {selectedFloor === '-1' && <FloorMinus1 darkMode={darkMode}/>}
            {selectedFloor === '0'  && <FloorZemin  onOfficeClick={handleOfficeClick} selectedOffice={selectedOffice} darkMode={darkMode}/>}
            {selectedFloor === '1'  && <Floor1      onOfficeClick={handleOfficeClick} selectedOffice={selectedOffice} darkMode={darkMode}/>}
            {selectedFloor === '2'  && <Floor2      onOfficeClick={handleOfficeClick} selectedOffice={selectedOffice} darkMode={darkMode}/>}

            {/* ── Popup ── */}
            {popupData && statusInfo && (
              <div style={{
                position: 'absolute',
                top: Math.max((popupData.y || 0) - 10, 10),
                left: Math.min((popupData.x || 0) + 16, 280),
                backgroundColor: t.surface,
                border: `1.5px solid ${t.border}`,
                borderRadius: '16px',
                padding: '18px 20px',
                minWidth: '210px', maxWidth: '250px',
                boxShadow: darkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(15,60,120,0.18)',
                zIndex: 20,
              }}>
                {/* Popup header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 900, color: t.title, letterSpacing: '-.5px' }}>{popupData.id}</span>
                  <button
                    onClick={() => { setSelectedOffice(null); setPopupData(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, fontSize: '20px', lineHeight: 1, padding: '0 2px', fontFamily: 'inherit' }}
                  >×</button>
                </div>

                {/* Status pill */}
                <span style={{ background: statusInfo.bg, color: statusInfo.text, border: `1.5px solid ${statusInfo.border}`, fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '22px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusInfo.fill, display: 'inline-block', flexShrink: 0 }}/>
                  {statusInfo.label}
                </span>

                {/* Occupancy */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: t.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Occupancy</span>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: statusInfo.text }}>{popupData.detail.occupants}/{popupData.detail.capacity}</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#E2EDF9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((popupData.detail.occupants / popupData.detail.capacity) * 100, 100)}%`, backgroundColor: statusInfo.fill, borderRadius: '3px', transition: 'width .3s' }}/>
                  </div>
                </div>

                {/* People */}
                {popupData.detail.people.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: t.sub, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Occupants</div>
                    {popupData.detail.people.map((p, i) => {
                      const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                      const initials = p.split(' ').filter(w => !['Dr.','Prof.'].includes(w)).slice(0, 2).map(w => w[0]).join('');
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 0', borderTop: i > 0 ? `1px solid ${t.border}` : 'none' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `${avatarColor}20`, border: `1.5px solid ${avatarColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: avatarColor }}>{initials}</span>
                          </div>
                          <span style={{ fontSize: '12px', color: t.text, fontWeight: 600 }}>{p}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: t.sub, fontWeight: 600, fontStyle: 'italic' }}>No occupants assigned</div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}