import { useState, useRef, useEffect } from "react";
import { loginOrCreateUser, registerHorse, getMyHorses, getAllHorses, deleteHorse, saveDeadline, getDeadline, clearDeadline, MAX_HORSES, getIssuedCount } from "./firebase/db";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "naadam2026";
const EXPLAINER_CODE = "tailbar2026";

// Sequential number counter — first paid horse gets #1, next #2, etc.
let nextHorseNumber = { value: 1 };
function getNextNumber() { return nextHorseNumber.value++; }


const AGE_GROUPS = [
  { id: 1, name: "Даага" },
  { id: 2, name: "Шүдлэн" },
  { id: 3, name: "Хязаалан" },
  { id: 4, name: "Соёолон" },
  { id: 5, name: "Их нас" },
  { id: 6, name: "Азарга" },
  { id: 7, name: "Сонгомол дээд" },
  { id: 8, name: "Сонгомол дунд" },
  { id: 9, name: "Сонгомол бага" },
];






// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
:root{
  --navy:#033aa0;--navy2:#022b78;--navy3:#0a4bc0;--navy4:#023086;
  --gold:#e8c060;--gold2:#f5d882;--gold3:#b8922a;--gold-bg:rgba(232,192,96,.12);
  --red:#c0392b;--red2:#e74c3c;
  --white:#fff;--white-dim:rgba(255,255,255,.75);--white-faint:rgba(255,255,255,.15);
  --border-gold:rgba(232,192,96,.35);--border-white:rgba(255,255,255,.15);
  --green:rgba(39,174,96,.15);--green-b:rgba(39,174,96,.35);--green-t:#2ecc71;
}
*{box-sizing:border-box;margin:0;padding:0;}
body,#root{font-family:'Poppins',sans-serif;font-size:17px;background:var(--navy2);color:var(--white);min-height:100vh;}
.app{min-height:100vh;background:var(--navy);position:relative;overflow-x:hidden;}
.app::before{content:"";position:fixed;inset:0;
  background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(232,192,96,.08) 0%,transparent 70%),url('/cloud-pattern.png');
  background-repeat:no-repeat,repeat;
  background-size:auto,340px auto;
  pointer-events:none;z-index:0;}
.app>*{position:relative;z-index:1;}

/* HEADER */
.hdr{background:rgba(2,43,120,.92);border-bottom:1px solid var(--border-gold);padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
.logo-text{font-family:'Poppins',sans-serif;font-size:20px;font-weight:700;color:var(--gold);letter-spacing:2px;}
.logo-sub{font-size:12px;color:var(--white-dim);letter-spacing:1px;margin-top:-2px;}
.nav-tabs{display:flex;gap:4px;}
.ntab{padding:8px 14px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--white-dim);font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:5px;}
.ntab.active{background:var(--gold-bg);border-color:var(--border-gold);color:var(--gold);}
.ntab:hover:not(.active){background:var(--white-faint);color:var(--white);}
.user-badge{background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:20px;padding:6px 14px;font-size:15px;color:var(--gold2);font-weight:600;cursor:pointer;transition:all .2s;}
.user-badge:hover{background:rgba(232,192,96,.2);}
.role-chip{display:inline-block;border-radius:12px;padding:3px 10px;font-size:13px;font-weight:700;letter-spacing:.5px;margin-left:6px;}
.role-admin{background:rgba(192,57,43,.2);border:1px solid rgba(192,57,43,.4);color:#ff8a80;}
.role-explainer{background:rgba(52,152,219,.2);border:1px solid rgba(52,152,219,.4);color:#7ec8f5;}
.role-user{background:var(--gold-bg);border:1px solid var(--border-gold);color:var(--gold2);}

/* AUTH */
.auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.auth-card{background:rgba(3,58,160,.6);border:1px solid var(--border-gold);border-radius:20px;padding:40px 36px;width:100%;max-width:420px;text-align:center;backdrop-filter:blur(20px);}
.auth-emblem{font-size:50px;margin-bottom:8px;}
.auth-title{font-family:'Poppins',sans-serif;font-size:24px;color:var(--gold);margin-bottom:4px;letter-spacing:2px;}
.auth-subtitle{font-size:15px;color:var(--white-dim);margin-bottom:24px;line-height:1.6;}
.tab-row{display:flex;gap:6px;margin-bottom:20px;}
.tab-btn{flex:1;padding:10px;border-radius:10px;border:1px solid var(--border-white);background:var(--white-faint);color:var(--white-dim);font-family:'Poppins',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;}
.tab-btn.active{background:var(--gold-bg);border-color:var(--border-gold);color:var(--gold);}

label{display:block;text-align:left;font-size:15px;font-weight:600;color:var(--white-dim);margin-bottom:6px;margin-top:14px;}
input[type="text"],input[type="number"],input[type="password"],input[type="number"],select,textarea{width:100%;background:var(--white-faint);border:1px solid var(--border-white);border-radius:10px;padding:12px 14px;color:var(--white);font-family:'Poppins',sans-serif;font-size:17px;transition:all .2s;outline:none;}
input::placeholder{color:rgba(255,255,255,.3);}
input:focus,select:focus,textarea:focus{border-color:var(--gold);background:rgba(232,192,96,.08);}
select option{background:var(--navy);color:var(--white);}
textarea{resize:vertical;min-height:72px;}

/* BUTTONS */
.btn-gold{width:100%;background:linear-gradient(135deg,var(--gold3),var(--gold));border:none;border-radius:10px;padding:14px;color:var(--navy2);font-family:'Poppins',sans-serif;font-size:17px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:18px;letter-spacing:.3px;}
.btn-gold:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btn-gold:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.btn-outline{background:transparent;border:1px solid var(--border-gold);border-radius:10px;padding:11px 20px;color:var(--gold);font-family:'Poppins',sans-serif;font-size:16px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-outline:hover{background:var(--gold-bg);}
.btn-ghost{background:var(--white-faint);border:1px solid var(--border-white);border-radius:10px;padding:10px 16px;color:var(--white-dim);font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-ghost:hover{background:rgba(255,255,255,.2);color:var(--white);}
.btn-red{background:rgba(192,57,43,.2);border:1px solid rgba(192,57,43,.4);border-radius:8px;padding:7px 14px;color:#ff8a80;font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-red:hover{background:rgba(192,57,43,.35);}

/* OTP */

/* PAGE WRAPPER */
.page{padding:24px 20px 48px;max-width:920px;margin:0 auto;}
.page-sm{padding:24px 20px 48px;max-width:640px;margin:0 auto;}

/* BACK */
.back-btn{display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--white-dim);font-family:'Poppins',sans-serif;font-size:16px;cursor:pointer;padding:0;margin-bottom:20px;transition:color .2s;}
.back-btn:hover{color:var(--gold);}

/* SECTION TITLE */
.sec-title{font-family:'Poppins',sans-serif;font-size:17px;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;gap:10px;}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border-gold);}

/* BANNER */
.banner{background:rgba(3,58,160,.5);border:1px solid var(--border-gold);border-radius:16px;padding:20px 24px;margin-bottom:22px;position:relative;overflow:hidden;}
.banner::after{content:'';position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:72px;opacity:.1;}
.banner h2{font-family:'Poppins',sans-serif;font-size:22px;color:var(--gold);margin-bottom:6px;}
.banner p{color:var(--white-dim);font-size:15px;line-height:1.6;max-width:480px;}

/* STATS */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px;}
.stat-card{background:var(--white-faint);border:1px solid var(--border-white);border-radius:12px;padding:14px;text-align:center;}
.stat-val{font-family:'Poppins',sans-serif;font-size:24px;color:var(--gold);font-weight:700;}
.stat-label{font-size:13px;color:var(--white-dim);margin-top:3px;text-transform:uppercase;letter-spacing:.5px;}

/* AGE GRID */
.age-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.age-card{background:rgba(3,58,160,.5);border:1px solid var(--border-white);border-radius:14px;padding:18px 14px;transition:all .25s;text-align:center;}
.age-card.has{border-color:var(--border-gold);}
.age-label{font-family:'Poppins',sans-serif;font-size:16px;color:var(--white);font-weight:700;margin-bottom:4px;}
.badge{display:inline-block;border-radius:20px;padding:3px 10px;font-size:13px;font-weight:700;}
.badge-gold{background:var(--gold-bg);border:1px solid var(--border-gold);color:var(--gold2);}
.badge-dim{background:var(--white-faint);border:1px solid var(--border-white);color:var(--white-dim);}
.age-reg-btn{margin-top:10px;width:100%;background:linear-gradient(135deg,var(--gold3),var(--gold));border:none;border-radius:8px;padding:9px 0;color:var(--navy2);font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;}
.age-reg-btn:hover{filter:brightness(1.1);}

/* FORM CARD */
.fcard{background:rgba(3,58,160,.5);border:1px solid var(--border-white);border-radius:16px;padding:22px;margin-bottom:14px;}
.fcard h3{font-family:'Poppins',sans-serif;font-size:16px;color:var(--gold);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-gold);}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.err-msg{color:var(--red2);font-size:14px;margin-top:4px;}

/* UPLOAD */
.upload-zone{border:2px dashed var(--border-gold);border-radius:10px;padding:16px;text-align:center;cursor:pointer;transition:all .2s;margin-top:4px;position:relative;overflow:hidden;}
.upload-zone:hover,.upload-zone.filled{background:var(--gold-bg);}
.upload-zone.filled{border-color:var(--gold);}
.upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;background:none;border:none;}
.upload-preview{width:100%;max-height:200px;object-fit:contain;border-radius:7px;margin-top:6px;background:rgba(0,0,0,0.15);}
.upload-icon{font-size:26px;margin-bottom:4px;}
.upload-lbl{font-size:14px;color:var(--white-dim);font-weight:600;}
.upload-hint{font-size:13px;color:rgba(255,255,255,.35);margin-top:2px;}

/* COUNT GRID */

/* STEP DOTS */

/* NUMBER REVEAL */
.num-circle{width:130px;height:130px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold));display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 0 40px rgba(232,192,96,.3);}
.num-big{font-family:'Poppins',sans-serif;font-size:46px;font-weight:700;color:var(--navy2);line-height:1;}
.num-lbl{font-size:13px;color:var(--navy3);font-weight:700;letter-spacing:1px;text-transform:uppercase;}

/* PAYMENT */
.pay-summary{background:rgba(3,58,160,.5);border:1px solid var(--border-gold);border-radius:14px;padding:18px;margin-bottom:18px;}
.pay-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border-white);font-size:16px;}
.pay-row:last-child{border-bottom:none;}
.pay-total{font-size:18px;font-weight:700;color:var(--gold);margin-top:4px;}
.bank-info-box{background:rgba(3,58,160,.7);border:2px solid var(--border-gold);border-radius:14px;padding:22px;margin-bottom:18px;}
.bank-info-title{font-family:'Poppins',sans-serif;font-size:16px;color:var(--gold2);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-gold);display:flex;align-items:center;gap:8px;}
.bank-info-row{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border-white);}
.bank-info-row:last-child{border-bottom:none;}
.bank-info-label{font-size:14px;color:var(--white-dim);font-weight:600;}
.bank-info-val{font-size:16px;color:var(--white);font-weight:700;font-family:'Poppins',sans-serif;letter-spacing:.5px;}
.bank-info-val.highlight{color:var(--gold);font-size:20px;letter-spacing:2px;}
.copy-btn{background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:6px;padding:4px 10px;color:var(--gold2);font-size:13px;font-weight:700;cursor:pointer;font-family:'Poppins',sans-serif;transition:all .2s;margin-left:8px;}
.copy-btn:hover{background:rgba(232,192,96,.25);}
.txn-input-box{background:rgba(3,58,160,.5);border:1px solid var(--border-gold);border-radius:14px;padding:20px;margin-bottom:16px;}
.txn-input-box h4{font-family:'Poppins',sans-serif;font-size:15px;color:var(--gold);margin-bottom:12px;}
.txn-id-display{background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:8px;padding:10px 14px;font-family:'Poppins',sans-serif;font-size:22px;font-weight:700;color:var(--gold);text-align:center;letter-spacing:3px;margin-bottom:12px;}

/* WARNING */
.warn-box{background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.35);border-radius:10px;padding:12px 14px;font-size:15px;color:#ff8a80;line-height:1.5;margin-bottom:14px;display:flex;gap:8px;align-items:flex-start;}

/* HORSE LIST ITEM */
.horse-item{background:rgba(3,58,160,.5);border:1px solid var(--border-white);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px;cursor:pointer;transition:all .2s;}
.horse-item:hover{border-color:var(--border-gold);}
.horse-num{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--gold3),var(--gold));display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;font-size:18px;font-weight:700;color:var(--navy2);flex-shrink:0;}
.horse-name{font-weight:700;font-size:16px;}
.horse-meta{font-size:14px;color:var(--white-dim);margin-top:2px;}
.status-paid{margin-left:auto;background:var(--green);border:1px solid var(--green-b);border-radius:20px;padding:3px 10px;font-size:13px;color:var(--green-t);font-weight:700;white-space:nowrap;flex-shrink:0;}
.status-pend{margin-left:auto;background:rgba(192,57,43,.12);border:1px solid rgba(192,57,43,.3);border-radius:20px;padding:3px 10px;font-size:13px;color:var(--red2);font-weight:700;white-space:nowrap;flex-shrink:0;}

/* EXPLAINER */
.live-dot{width:11px;height:11px;border-radius:50%;background:var(--red2);animation:pulse 1.5s infinite;flex-shrink:0;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}
.filter-bar{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px;}
.chip{padding:6px 14px;border-radius:20px;border:1px solid var(--border-white);background:var(--white-faint);color:var(--white-dim);font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Poppins',sans-serif;}
.chip.active,.chip:hover{border-color:var(--gold);background:var(--gold-bg);color:var(--gold);}
.horse-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}
.exp-card{background:rgba(3,58,160,.5);border:1px solid var(--border-white);border-radius:14px;overflow:hidden;cursor:pointer;transition:all .25s;}
.exp-card:hover{border-color:var(--border-gold);transform:translateY(-2px);}
.exp-img{width:100%;height:90px;background:linear-gradient(135deg,var(--navy3),var(--navy4));display:flex;align-items:center;justify-content:center;font-size:38px;position:relative;}
.exp-img img{width:100%;height:100%;object-fit:cover;}
.num-badge{position:absolute;top:7px;left:7px;background:linear-gradient(135deg,var(--gold3),var(--gold));border-radius:7px;padding:2px 9px;font-family:'Poppins',sans-serif;font-size:15px;font-weight:700;color:var(--navy2);}
.exp-body{padding:12px;}
.exp-name{font-weight:700;font-size:16px;margin-bottom:3px;}
.exp-meta{font-size:14px;color:var(--white-dim);line-height:1.5;}
.tag{display:inline-block;background:var(--gold-bg);border:1px solid var(--border-gold);border-radius:5px;padding:1px 7px;font-size:13px;color:var(--gold2);font-weight:700;}

/* ADMIN */
.admin-tabs{display:flex;gap:6px;margin-bottom:22px;flex-wrap:wrap;}
.adm-tab{padding:9px 18px;border-radius:10px;border:1px solid var(--border-white);background:var(--white-faint);color:var(--white-dim);font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;}
.adm-tab.active{background:rgba(192,57,43,.15);border-color:rgba(192,57,43,.4);color:#ff8a80;}
.adm-tab:hover:not(.active){background:rgba(255,255,255,.1);color:var(--white);}
.adm-card{background:rgba(3,58,160,.5);border:1px solid var(--border-white);border-radius:14px;padding:18px;margin-bottom:10px;}
.adm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-white);font-size:16px;}
.adm-row:last-child{border-bottom:none;}
.adm-label{color:var(--white-dim);font-size:15px;min-width:100px;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(6,14,58,.85);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;backdrop-filter:blur(8px);}
.modal{background:var(--navy);border:1px solid var(--border-gold);border-radius:18px;padding:26px;width:100%;max-width:500px;max-height:82vh;overflow-y:auto;}
.modal-title{font-family:'Poppins',sans-serif;font-size:19px;color:var(--gold);margin-bottom:14px;padding-bottom:11px;border-bottom:1px solid var(--border-gold);display:flex;justify-content:space-between;align-items:center;}
.modal-close{background:none;border:none;color:var(--white-dim);font-size:24px;cursor:pointer;line-height:1;padding:0 4px;}
.detail-row{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-white);font-size:16px;}
.detail-row:last-child{border-bottom:none;}
.detail-lbl{color:var(--white-dim);min-width:110px;font-weight:600;font-size:15px;flex-shrink:0;}

/* MISC */
.spinner{width:30px;height:30px;border:3px solid var(--border-gold);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px;}
@keyframes spin{to{transform:rotate(360deg);}}
.pass-wrap{position:relative;}
.pass-wrap input{padding-right:42px;}
.eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,.45);font-size:20px;cursor:pointer;padding:0;line-height:1;transition:color .2s;}
.eye-btn:hover{color:var(--gold);}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--gold3),var(--gold));color:var(--navy2);padding:12px 20px;border-radius:16px;font-weight:700;font-size:16px;z-index:300;box-shadow:0 6px 28px rgba(232,192,96,.4);animation:toastIn .3s ease;white-space:normal;max-width:calc(100vw - 32px);width:max-content;text-align:center;line-height:1.5;word-break:keep-all;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(16px);}}
@media(max-width:480px){.toast{bottom:16px;font-size:15px;padding:10px 16px;border-radius:12px;}}
.empty-state{text-align:center;padding:56px 20px;color:var(--white-dim);}
.empty-state .big{font-size:46px;margin-bottom:10px;}
.info-row{background:rgba(3,58,160,.4);border:1px solid var(--border-gold);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:10px;margin-bottom:20px;}

@media(max-width:620px){
  .age-grid{grid-template-columns:repeat(3,1fr);}
  .stats-row{grid-template-columns:repeat(2,1fr);}
  .form-row{grid-template-columns:1fr;}
  .bank-grid{grid-template-columns:1fr 1fr;}
  .ntab span{display:none;}
  .hdr{padding:0 12px;}
}
`;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Auth state — persisted to localStorage so refresh doesn't log out
  const [role, setRole] = useState(()=>{
    try { return localStorage.getItem("naadam_role") || null; } catch(e){ return null; }
  });
  const [authTab, setAuthTab] = useState("user"); // user | admin | explainer
  const [user, setUser] = useState(()=>{
    try {
      const saved = localStorage.getItem("naadam_user");
      return saved ? JSON.parse(saved) : null;
    } catch(e){ return null; }
  });

  // Registration closes July 11, 23:00
  const [regDeadline, setRegDeadline] = useState(()=>{
    const saved = localStorage.getItem("naadam_reg_deadline");
    return saved || "2026-07-11T23:00";
  });
  const isRegClosed = regDeadline && new Date() > new Date(regDeadline);

  // Navigation — also persist screen/role so refresh stays on dashboard, not login
  const [screen, setScreen] = useState(()=>{
    try {
      const savedRole = localStorage.getItem("naadam_role");
      const savedUser = localStorage.getItem("naadam_user");
      if(savedRole && savedUser) return "dashboard";
    } catch(e){}
    return "login";
  });
  const [activeNav, setActiveNav] = useState("dashboard");

  // Persist role/user to localStorage whenever they change
  useEffect(()=>{
    try {
      if(role) localStorage.setItem("naadam_role", role); else localStorage.removeItem("naadam_role");
      if(user) localStorage.setItem("naadam_user", JSON.stringify(user)); else localStorage.removeItem("naadam_user");
    } catch(e){}
  },[role,user]);

  // Horse registration state
  const [selectedAge, setSelectedAge] = useState(null);
  const [horseCount, setHorseCount] = useState(0);
  const [curIdx, setCurIdx] = useState(0);
  const [hForm, setHForm] = useState({});
  const [hFormErr, setHFormErr] = useState({});
  const [pendingHorses, setPendingHorses] = useState([]);

  // Global horse store (simulates DB)
  const [allReg, setAllReg] = useState({}); // { ageGroupId: [horse,...] }

  // On page load/refresh, if a user session was restored, reload their data from Firebase
  useEffect(()=>{
    if(!role || !user) return;
    (async()=>{
      try {
        if(role==="user" && user.phone){
          const horses = await getMyHorses(user.phone);
          const byAge = {};
          horses.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
          setAllReg(byAge);
          if(horses.length>0){ setScreen("success"); }
          else { setScreen("dashboard"); setActiveNav("dashboard"); }
        } else if(role==="admin"){
          const allH = await getAllHorses();
          const byAge = {};
          allH.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
          setAllReg(byAge);
          getIssuedCount().then(setIssuedCount).catch(()=>{});
          setScreen("admin"); setActiveNav("admin");
          const dl = await getDeadline();
          if(dl){ setRegDeadline(dl); localStorage.setItem("naadam_reg_deadline",dl); }
        } else if(role==="explainer"){
          setScreen("explainer"); setActiveNav("explainer");
        }
      } catch(e){ console.error("Session restore error:", e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]); // run once on mount only

  const [isSaving, setIsSaving] = useState(false);
  const [issuedCount, setIssuedCount] = useState(0);

  // Explainer / Admin UI
  const [expFilter, setExpFilter] = useState("all");
  const [expSearch, setExpSearch] = useState("");
  const [expHorse, setExpHorse] = useState(null);
  const [adminTab, setAdminTab] = useState("overview");
  const [adminHorse, setAdminHorse] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(null),3000); };

  // Derived
  const flatHorses = Object.values(allReg).flat();

  // Countdown timer display
  const [timeLeft, setTimeLeft] = useState("");
  useState(()=>{
    const tick = () => {
      if (!regDeadline) { setTimeLeft(""); return; }
      const diff = new Date(regDeadline) - new Date();
      if (diff <= 0) { setTimeLeft("Бүртгэл хаагдсан"); return; }
      const d = Math.floor(diff/86400000);
      const h = Math.floor((diff%86400000)/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setTimeLeft(`${d>0?d+"өдөр ":""}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return ()=>clearInterval(id);
  });
  const paidHorses = flatHorses.filter(h=>h.paid);
  const pendCount = flatHorses.filter(h=>!h.paid).length;
  const myHorses = flatHorses.filter(h=>h.ownerPhone === user?.phone);
  const lastPending = pendingHorses[pendingHorses.length-1];

  // ── AUTH HANDLERS ────────────────────────────────────────────────────────
  const doRegister = async () => {
    const surname = document.getElementById("rs")?.value?.trim();
    const name = document.getElementById("rn")?.value?.trim();
    const el_rp = document.getElementById("rp"); const phone = (el_rp?.dataset?.val || el_rp?.value || "").trim();
    if(!surname||!name){showToast("Овог нэрээ оруулна уу");return;}
    if(!phone||phone.replace(/\D/g,"").length!==8){showToast("Гар утасны дугаар 8 оронтой байх ёстой");return;}
    try {
      const fbUser = await loginOrCreateUser({surname, givenName:name, phone});
      setUser({...fbUser, givenName:name, surname, phone});
      setRole("user"); setScreen("dashboard"); setActiveNav("dashboard");
      const horses = await getMyHorses(phone);
      const byAge = {};
      horses.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
      setAllReg(byAge);
      showToast("Тавтай морилно уу!");
    } catch(e){ showToast("Алдаа: "+e.message); }
  };
  const doLogin = async () => {
    const el_lp = document.getElementById("lp"); const phone = (el_lp?.dataset?.val || el_lp?.value || "").trim();
    if(!phone||phone.replace(/\D/g,"").length!==8){showToast("Гар утасны дугаар 8 оронтой байх ёстой");return;}
    try {
      // Find existing user by phone
      const fbUser = await loginOrCreateUser({surname:"", givenName:"", phone});
      if(!fbUser.givenName && !fbUser.surname){
        showToast("Ийм утасны дугаартай хэрэглэгч олдсонгүй. Дугаараа зөв бичсэн эсэхээ шалгана уу, эсвэл бүртгүүлнэ үү.");
        return;
      }
      setUser({...fbUser, givenName: fbUser.givenName || phone, phone});
      setRole("user"); setScreen("dashboard"); setActiveNav("dashboard");
      const horses = await getMyHorses(phone);
      const byAge = {};
      horses.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
      setAllReg(byAge);
      showToast("Тавтай морилно уу!");
    } catch(e){
      showToast("Ийм утасны дугаартай хэрэглэгч олдсонгүй. Дугаараа зөв бичсэн эсэхээ шалгана уу, эсвэл бүртгүүлнэ үү.");
    }
  };
  const doAdminLogin = async () => {
    const u = document.getElementById("au")?.value?.trim();
    const p = document.getElementById("ap")?.value?.trim();
    if(u===ADMIN_USER && p===ADMIN_PASS){
      setUser({name:"Админ"}); setRole("admin"); setScreen("admin"); setActiveNav("admin");
      try {
        const allH = await getAllHorses();
        const byAge = {};
        allH.forEach(h=>{ if(!byAge[h.ageGroupId]) byAge[h.ageGroupId]=[]; byAge[h.ageGroupId].push(h); });
        setAllReg(byAge);
        getIssuedCount().then(setIssuedCount).catch(()=>{});
        const dl = await getDeadline();
        if(dl){ setRegDeadline(dl); localStorage.setItem("naadam_reg_deadline",dl); }
      } catch(e){ console.error("Admin load:", e); showToast("Алдаа: "+e.message); }
    } else { showToast("Нэвтрэх нэр эсвэл нууц үг буруу байна"); }
  };
  const doExplainerLogin = () => {
    const code = document.getElementById("ec")?.value?.trim();
    if(code===EXPLAINER_CODE){
      setUser({name:"Тайлбарлагч"}); setRole("explainer"); setScreen("explainer"); setActiveNav("explainer");
    } else { showToast("Код буруу байна"); }
  };
  const doOtp = () => {
    if(otp.join("").length<4){showToast("4 оронтой OTP код оруулна уу");return;}
    setScreen("dashboard"); setActiveNav("dashboard"); showToast("Амжилттай нэвтэрлээ!");
  };
  const logout=()=>{
    setRole(null);setUser(null);setScreen("login");setActiveNav("dashboard");
    try { localStorage.removeItem("naadam_role"); localStorage.removeItem("naadam_user"); } catch(e){}
  };

  // ── REGISTRATION FLOW ────────────────────────────────────────────────────
  const openAge=(ag)=>{setSelectedAge(ag);setHorseCount(1);setCurIdx(0);setHForm({riderAge:8});setScreen("horseForm");};

  const setField=(k,v)=>{
    setHForm(f=>({...f,[k]:v}));
    if(hFormErr[k])setHFormErr(e=>{const n={...e};delete n[k];return n;});
  };

  // Allow only Cyrillic letters, spaces, digits, punctuation — block Latin letters
  const cyrilOnly = (v) => {
    if (/[A-Za-z]/.test(v)) showToast("⚠ Та зөвхөн Монголоор бичнэ үү");
    return v.replace(/[A-Za-z]/g, "");
  };
  // For registration number: allow Cyrillic letters + digits only, warn on Latin
  const regOnly = (v) => {
    if (/[A-Za-z]/.test(v)) showToast("⚠ Та зөвхөн Монголоор бичнэ үү");
    return v.replace(/[^А-ЯҮӨЁа-яүөё0-9]/gu, "").toUpperCase();
  };

  // Parse Mongolian national registration number: 2 letters + YYMMDD (6 digits)
  // Returns { valid, dob: Date, age, tooYoung } or { valid: false, reason }
  const parseRegNum = (reg) => {
    if (!reg) return { valid: false, reason: "Регистрийн дугаар оруулна уу" };
    const clean = reg.trim().toUpperCase();
    // Format: 2 Cyrillic letters + YY (birth year) + 6 random digits = 10 chars
    // e.g. АА19123456
    const valid10 = /^[А-ЯҮӨЁ]{2}[0-9]{8}$/u;
    if (!valid10.test(clean)) {
      return { valid: false, reason: "Регистрийн дугаар буруу байна (Жишээ: УШ16080752 — 2 кирилл үсэг + ОН + 6 тоо, нийт 10 тэмдэгт)" };
    }
    // Extract birth year from positions 2-3
    const yy = parseInt(clean.slice(2, 4), 10);
    // Century: 00–26 → 2000s, 27–99 → 1900s
    const birthYear = yy <= 26 ? 2000 + yy : 1900 + yy;
    const today = new Date(2026, 5, 6);
    const currentYear = today.getFullYear();
    // Minimum age: 7 years → born in 2019 or earlier (2026 - 7 = 2019)
    const maxBirthYear = currentYear - 8; // 2018
    if (birthYear > maxBirthYear) {
      return { valid: false, tooYoung: true, birthYear, approxAge: currentYear - birthYear };
    }
    const approxAge = currentYear - birthYear;
    return { valid: true, birthYear, approxAge };
  };

  const validateForm=(f)=>{
    const e={};
    if(!f.horseName)e.horseName="Морины нэр оруулна уу";
    if(!f.ownerName)e.ownerName="Эзний нэр оруулна уу";
    if(!f.uyaachName)e.uyaachName="Уяачийн нэр оруулна уу";
    if(!f.riderName)e.riderName="Уралдаанч хүүхдийн нэр оруулна уу";
    if(f.wantsTavich===true && !f.tavichName)e.tavichName="Тавиачийн нэр оруулна уу";
    // Validate rider registration number and minimum age

    return e;
  };

  const saveHorse=async()=>{
    if(isSaving) return;
    setIsSaving(true);
    const errs=validateForm(hForm);
    if(Object.keys(errs).length){setHFormErr(errs);showToast("Заавал талбаруудыг бөглөнө үү");setIsSaving(false);return;}
    setHFormErr({});
    showToast("Дугаар авч байна...");
    // Nationwide app is free — every horse gets its own new number,
    // confirmed instantly (no payment, no admin approval needed).
    let realNum = null;
    let fbId = null;
    let tavichNum = null;
    const tavichNameToSend = hForm.wantsTavich===true ? (hForm.tavichName||"").trim() : "";
    try {
      const fbHorse = await registerHorse(user?.id, user?.phone, selectedAge.id, selectedAge.name, {...hForm, number:0}, tavichNameToSend || undefined);
      realNum = fbHorse.number;
      fbId = fbHorse.id;
      tavichNum = fbHorse.tavichNumber || null;
    } catch(e){
      console.error("Firebase save error:", e);
      showToast("Алдаа: "+(e.message||e.code||"Firebase холбогдсонгүй"));
      setIsSaving(false);
      return;
    }
    if(!realNum){ showToast("Дугаар авахад алдаа гарлаа"); setIsSaving(false); return; }
    const priorHorses = Object.values(allReg).flat().filter(h=>h.ownerPhone===user?.phone);
    const wasReused = priorHorses.some(h=>h.number===realNum);
    const horse={...hForm,number:realNum,tavichName:tavichNameToSend||null,tavichNumber:tavichNum,needsPayment:false,reused:wasReused,ageGroupId:selectedAge.id,ageGroupName:selectedAge.name,
      ownerPhone:user?.phone,paid:true,approved:true,id:Date.now()+Math.random(),fbId};
    setPendingHorses(p=>[...p,horse]);
    setAllReg(prev=>{
      const n={...prev};
      if(!n[horse.ageGroupId])n[horse.ageGroupId]=[];
      n[horse.ageGroupId]=[...n[horse.ageGroupId],horse];
      return n;
    });
    setIsSaving(false);
    setScreen("numReveal");
    // Email notification to admin — registration is already confirmed, this is just an FYI
    try {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          service_id:"service_vmx913m",
          template_id:"template_46vt3tn",
          user_id:"DTGia4q2qtmWYghHq",
          template_params:{
            owner_name: user?.name,
            phone: user?.phone,
            horse_numbers: String(realNum),
            age_groups: selectedAge.name,
            amount: 0,
            horse_details: `Дугаар: ${realNum} | Морь: ${horse.horseName} | Ангилал: ${horse.ageGroupName} | Зүс: ${horse.horseColor||"—"} | Эзэн: ${horse.ownerName} (${horse.ownerRegion||"—"}) | Уяач: ${horse.uyaachName||"—"} (${horse.uyaachRegion||"—"}) | Уралдаанч: ${horse.riderName}, ${horse.riderSchool||"—"}, ${horse.riderAge||"—"} нас${horse.tavichName?` | Тавиач: ${horse.tavichName} (Дугаар #${horse.tavichNumber})`:""} | Төлбөр: Үнэгүй`
          }
        })
      });
    } catch(e){ console.log("Email notification failed:", e); }
  };

  const afterReveal=()=>{
    // Go back to dashboard so user can register more horses in other age categories
    setScreen("dashboard");
    setActiveNav("dashboard");
    showToast("Морь бүртгэгдлээ! Дараагийн морио бүртгэх боломжтой.");
  };

  const finishRegistration=()=>{
    setScreen("success");
    setActiveNav("dashboard");
  };
  // ── EXPORT CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      "Дугаар","Морины нэр","Зүс","Насны ангилал",
      "Эзний нэр","Эзний цол","Эзний харъяалал",
      "Уяачийн нэр","Уяачийн цол",
      "Уралдаанч нэр","Уралдаанчийн сургууль","Уралдаанчийн нас","Өмнөх амжилт",
      "Тавиачийн нэр","Тавиачийн дугаар",
      "Төлөв","Бүртгэсэн огноо"
    ];
    const rows = flatHorses.map(h=>[
      h.number, h.horseName, h.horseColor||"",
      h.ageGroupName,
      h.ownerName, h.ownerTitle||"", h.ownerRegion||"",
      h.uyaachName||"", h.uyaachTitle||"",
      h.riderName, h.riderSchool||"", h.riderAge||"", (h.history||"").replace(/,/g,"；").replace(/\n/g," "),
      h.tavichName||"", h.tavichNumber||"",
      "Баталгаажсан",
      h.id ? new Date(h.id).toLocaleDateString("mn-MN") : ""
    ].map(v=>
      typeof v==="string" && (v.includes(",") || v.includes('"') || v.includes("\n"))
        ? `"${v.replace(/"/g,'""')}"`
        : v
    ));
    const BOM = "﻿"; // UTF-8 BOM for Excel
    const csv = BOM + [headers, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `нааdam2026_бүртгэл_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${flatHorses.length} бүртгэл экспортлогдлоо ✓`);
  };

  const exportByAge = (ageId) => {
    const horses = ageId === "all" ? flatHorses : flatHorses.filter(h=>h.ageGroupId===ageId);
    const ageName = ageId === "all" ? "бүгд" : AGE_GROUPS.find(a=>a.id===ageId)?.name || ageId;
    const headers = [
      "Дугаар","Морины нэр","Зүс",
      "Эзний нэр","Уяачийн нэр",
      "Уралдаанч нэр","Уралдаанчийн нас","Тавиачийн нэр","Тавиачийн дугаар","Төлөв"
    ];
    const rows = horses.map(h=>[
      h.number, h.horseName, h.horseColor||"",
      h.ownerName, h.uyaachName||"",
      h.riderName, h.riderAge||"",
      h.tavichName||"", h.tavichNumber||"",
      "Баталгаажсан"
    ]);
    const BOM = "﻿";
    const csv = BOM + [headers, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `нааdam2026_${ageName}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${horses.length} морь экспортлогдлоо ✓`);
  };

  // Admin actions
  const adminReject=async(h)=>{
    try { await deleteHorse(h.fbId||h.id); } catch(e){}
    setAllReg(prev=>{
      const n={...prev};
      n[h.ageGroupId]=n[h.ageGroupId].filter(x=>x.id!==h.id);
      return n;
    });
    showToast("Бүртгэл цуцлагдлаа");
  };

  // Nav helper
  const goNav=(tab,sc)=>{setActiveNav(tab);setScreen(sc);};

  // Clipboard copy with textarea fallback for sandboxed environments
  const copyText = (text, label) => {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); showToast(`${label} хуулагдлаа ✓`); }
      catch { showToast(`${label}: ${text}`); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(()=>showToast(`${label} хуулагдлаа ✓`)).catch(fallback);
    } else { fallback(); }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ── HEADER ── */}
        {role && (
          <header className="hdr">
            <div>
              <div className="logo-text">НААДАМ</div>
                          </div>

            <nav className="nav-tabs">
              {role==="user" && <>
                <button className={`ntab ${activeNav==="dashboard"?"active":""}`} onClick={()=>goNav("dashboard","dashboard")}>🏠 <span>Нүүр</span></button>
                <button className={`ntab ${activeNav==="myhorses"?"active":""}`} onClick={()=>goNav("myhorses","myhorses")}> <span>Морьд</span></button>
              </>}
              {role==="explainer" && (
                <button className={`ntab ${activeNav==="explainer"?"active":""}`} onClick={()=>goNav("explainer","explainer")}>📢 <span>Тайлбарлагч</span></button>
              )}
              {role==="admin" && <>
                <button className={`ntab ${activeNav==="admin"?"active":""}`} onClick={()=>goNav("admin","admin")}>🔐 <span>Удирдлага</span></button>
                <button className={`ntab ${activeNav==="explainer"?"active":""}`} onClick={()=>goNav("explainer","explainer")}>📢 <span>Тайлбарлагч</span></button>
              </>}
            </nav>

            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <div className="user-badge" style={{cursor:"default"}}>
                {role==="admin"&&<span className="role-chip role-admin">Админ</span>}
                {role==="explainer"&&<span className="role-chip role-explainer">Тайлбарлагч</span>}
                {role==="user"&&<span className="role-chip role-user">Хэрэглэгч</span>}
                {" "}{user?.givenName||user?.name?.split(" ")[1]||user?.name}
              </div>
              <button onClick={logout}
                style={{background:"rgba(192,57,43,.15)",border:"1px solid rgba(192,57,43,.4)",borderRadius:"20px",padding:"6px 14px",color:"#ff8a80",fontFamily:"'Poppins',sans-serif",fontSize:"15px",fontWeight:700,cursor:"pointer",transition:"all .2s"}}
                onMouseOver={e=>e.target.style.background="rgba(192,57,43,.3)"}
                onMouseOut={e=>e.target.style.background="rgba(192,57,43,.15)"}>
                Гарах
              </button>
            </div>
          </header>
        )}

        <main>

          {/* ══ LOGIN ══ */}
          {screen==="login" && (
            <div className="auth-screen">
              <div className="auth-card">
                <img src="/logo-naadam.png" alt="Наадам" style={{width:"230px",maxWidth:"65%",height:"auto",margin:"0 auto 14px",display:"block",filter:"drop-shadow(0 0 18px rgba(232,192,96,.5))"}}/>
                <div className="auth-subtitle">Хурдан морины бүртгэл</div>

                <div className="tab-row">
                  <button className={`tab-btn ${authTab==="user"?"active":""}`} onClick={()=>setAuthTab("user")}>👤 Хэрэглэгч</button>
                  <button className={`tab-btn ${authTab==="explainer"?"active":""}`} onClick={()=>setAuthTab("explainer")}>📢 Тайлбарлагч</button>
                  <button className={`tab-btn ${authTab==="admin"?"active":""}`} onClick={()=>setAuthTab("admin")}>🔐 Админ</button>
                </div>

                {/* USER */}
                {authTab==="user" && <UserAuth doRegister={doRegister} doLogin={doLogin}/>}

                {/* EXPLAINER */}
                {authTab==="explainer" && (
                  <>
                    <div className="info-row" style={{marginBottom:"4px"}}>
                      <span style={{fontSize:"22px"}}>📢</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:"16px",color:"var(--gold)"}}>Тайлбарлагчийн нэвтрэх</div>
                        <div style={{fontSize:"14px",color:"var(--white-dim)"}}>Зохион байгуулагчаас олгосон нэвтрэх кодоо оруулна уу</div>
                      </div>
                    </div>
                    <label>Нэвтрэх код</label>
                    <EyeInput id="ec" placeholder="Нэвтрэх код"/>
                    <button className="btn-gold" onClick={doExplainerLogin}>Нэвтрэх →</button>
                  </>
                )}

                {/* ADMIN */}
                {authTab==="admin" && (
                  <>
                    <div className="info-row" style={{marginBottom:"4px"}}>
                      <span style={{fontSize:"22px"}}>🔐</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:"16px",color:"#ff8a80"}}>Админы нэвтрэх</div>
                        <div style={{fontSize:"14px",color:"var(--white-dim)"}}>Зөвхөн зохион байгуулагчдад зориулагдсан</div>
                      </div>
                    </div>
                    <label>Нэвтрэх нэр</label>
                    <input id="au" type="text" placeholder="Нэвтрэх нэр"/>
                    <label>Нууц үг</label>
                    <EyeInput id="ap" placeholder="Нууц үг"/>
                    <button className="btn-gold" onClick={doAdminLogin} style={{background:"linear-gradient(135deg,#7b1010,var(--red2))"}}>Нэвтрэх →</button>
                  </>
                )}
              </div>
            </div>
          )}



          {/* ══ USER DASHBOARD ══ */}
          {screen==="dashboard" && role==="user" && (
            <div className="page">
              <div className="banner">
                <h2>Тавтай морилно уу, {user?.givenName}!</h2>
                <p>Мориныхоо насны ангиллыг сонгоод бүртгэлийг эхлүүлнэ үү. Энэ жил бүртгэл үнэ төлбөргүй.</p>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-val">{myHorses.length}</div><div className="stat-label">Нийт морь</div></div>
                  <div className="stat-card"><div className="stat-val">{myHorses.filter(h=>h.paid).length}</div><div className="stat-label">Баталгаажсан</div></div>
                  <div className="stat-card"><div className="stat-val">{flatHorses.length}</div><div className="stat-label">Нийт бүртгэл</div></div>
                  <div className="stat-card"><div className="stat-val">{AGE_GROUPS.length}</div><div className="stat-label">Насны ангилал</div></div>
                </div>
              </div>

              {/* Registration status banner */}
              {regDeadline && (
                <div style={{
                  background: isRegClosed ? "rgba(192,57,43,.15)" : "rgba(39,174,96,.1)",
                  border: `1px solid ${isRegClosed ? "rgba(192,57,43,.4)" : "rgba(39,174,96,.3)"}`,
                  borderRadius:"12px", padding:"12px 16px", marginBottom:"16px",
                  display:"flex", alignItems:"center", gap:"12px"
                }}>
                  <span style={{fontSize:"22px"}}>{isRegClosed ? "🔒" : "⏰"}</span>
                  <div>
                    <div style={{fontWeight:700, fontSize:"16px", color: isRegClosed ? "#ff8a80" : "#2ecc71"}}>
                      {isRegClosed ? "Бүртгэл хаагдсан" : `Бүртгэл хаагдах хүртэл: ${timeLeft}`}
                    </div>
                    <div style={{fontSize:"14px", color:"var(--white-dim)", marginTop:"2px"}}>
                      {isRegClosed
                        ? "Бүртгэлийн хугацаа дууссан байна"
                        : `Хаагдах огноо: ${new Date(regDeadline).toLocaleString("mn-MN")}`}
                    </div>
                  </div>
                </div>
              )}

              <div className="sec-title">Насны Ангилал — Морь Бүртгэх</div>
              <div className="age-grid">
                {AGE_GROUPS.map(ag=>{
                  const cnt=(allReg[ag.id]||[]).filter(h=>h.ownerPhone===user?.phone).length;
                  return (
                    <div key={ag.id} className={`age-card ${cnt>0?"has":""}`}>
                      <div className="age-label">{ag.name}</div>

                      {cnt>0 && <span className="badge badge-gold" style={{display:"block",marginBottom:"8px"}}>{cnt} морь бүртгэлтэй</span>}
                      {isRegClosed
                      ? <div className="age-reg-btn" style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.4)",cursor:"not-allowed"}}>🔒 Хаагдсан</div>
                      : <button className="age-reg-btn" onClick={()=>openAge(ag)}>{cnt>0?"+ Дахин бүртгэх":"+ Морь бүртгэх"}</button>
                    }
                    </div>
                  );
                })}
              </div>

              {myHorses.length>0 && <>
                <div className="sec-title">Миний Бүртгэлтэй Морьд</div>
                {myHorses.map(h=>(
                  <div key={h.id} className="horse-item">
                    <div className="horse-num">{h.number}</div>
                    <div><div className="horse-name">{h.horseName}</div><div className="horse-meta">{h.ageGroupName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div></div>
                    <span className="status-paid">✓ Баталгаажсан</span>
                  </div>
                ))}
              </>}
            </div>
          )}

          {/* ══ MY HORSES ══ */}
          {screen==="myhorses" && role==="user" && (
            <div className="page-sm">
              <div className="sec-title">Миний Морьд</div>
              {myHorses.length===0
                ? <div className="empty-state"><div className="big">📋</div><div>Одоохондоо бүртгэлтэй морь байхгүй</div></div>
                : myHorses.map(h=>(
                  <div key={h.id} className="horse-item">
                    <div className="horse-num">{h.number}</div>
                    <div>
                      <div className="horse-name">{h.horseName}</div>
                      <div className="horse-meta">{h.ageGroupName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div>
                    </div>
                    <span className="status-paid">✓ Баталгаажсан</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* ══ AGE GROUP ══ */}
          {/* ══ HORSE FORM ══ */}
          {screen==="horseForm" && selectedAge && (
            <div className="page-sm">
              <button className="back-btn" onClick={()=>setScreen("dashboard")}>← Буцах</button>
              <div style={{marginBottom:"14px"}}>
                <div style={{fontFamily:"'Poppins',sans-serif",color:"var(--gold)",fontSize:"18px",marginBottom:"3px"}}>{selectedAge.name} — {curIdx+1}-р морь</div>
                <div style={{color:"var(--white-dim)",fontSize:"15px"}}>{selectedAge?.name} ангилал — морины мэдээлэл</div>
              </div>
              

              {/* Horse */}
              <div className="fcard">
                <h3>Морины мэдээлэл</h3>
                <label>Морины нэр *</label>
                <input type="text" placeholder="Морины нэр" value={hForm.horseName||""} onChange={e=>setField("horseName",cyrilOnly(e.target.value))}/>
                {hFormErr.horseName&&<p className="err-msg">⚠ {hFormErr.horseName}</p>}
                <div>
                  <label>Морины зүс</label>
                  <input type="text" placeholder="Жишээ: Хүрэн, Шарга, Бор, Хар..." value={hForm.horseColor||""} onChange={e=>setField("horseColor",cyrilOnly(e.target.value))}/>
                </div>
                <label>Морины зураг (9×12) *</label>
                <div className={`upload-zone ${hForm.horseImage?"filled":""}`}>
                  <input type="file" accept="image/*" onChange={e=>{
                    const f=e.target.files[0];
                    if(f){
                      setField("horseImageName",f.name);
                      const reader=new FileReader();
                      reader.onload=ev=>{
                        const img=new Image();
                        img.onload=()=>{
                          const canvas=document.createElement("canvas");
                          const MAX=600;
                          let w=img.width, h=img.height;
                          if(w>h){if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}}
                          else{if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}}
                          canvas.width=w; canvas.height=h;
                          canvas.getContext("2d").drawImage(img,0,0,w,h);
                          let quality=0.5;
                          let result=canvas.toDataURL("image/jpeg",quality);
                          while(result.length>700000 && quality>0.1){
                            quality-=0.1;
                            result=canvas.toDataURL("image/jpeg",quality);
                          }
                          setField("horseImage",result);
                        };
                        img.src=ev.target.result;
                      };
                      reader.readAsDataURL(f);
                    }
                  }}/>
                  {hForm.horseImage
                    ? <><img src={hForm.horseImage} className="upload-preview" style={{objectFit:"contain",background:"rgba(0,0,0,0.2)"}} alt="horse"/><div style={{color:"var(--gold)",fontSize:"14px",marginTop:"6px"}}>✓ {hForm.horseImageName}</div></>
                    : <><div className="upload-icon">📷</div><div className="upload-lbl">Зураг оруулах</div><div className="upload-hint">9×12 см · JPG, PNG</div></>
                  }
                </div>
                <label>Тамга / Тэмдэг</label>
                <input type="text" placeholder="Тамгын дугаар эсвэл тайлбар" value={hForm.horseStamp||""} onChange={e=>setField("horseStamp",cyrilOnly(e.target.value))}/>
                <label>Өмнөх амжилт/ түүх</label>
                <textarea placeholder="Өмнөх амжилт, уралдааны дүн, байр..." value={hForm.history||""} onChange={e=>setField("history",e.target.value)}/>


              </div>

              {/* Owner */}
              <div className="fcard">
                <h3>👤 Эзний мэдээлэл</h3>
                <label>Эзний овог нэр *</label>
                <input type="text" placeholder="Бүтэн нэр" value={hForm.ownerName||""} onChange={e=>setField("ownerName",cyrilOnly(e.target.value))}/>
                {hFormErr.ownerName&&<p className="err-msg">⚠ {hFormErr.ownerName}</p>}
                <div className="form-row">
                  <div>
                    <label>Цол / Зэрэг</label>
                    <input type="text" placeholder="" value={hForm.ownerTitle||""} onChange={e=>setField("ownerTitle",cyrilOnly(e.target.value))}/>
                  </div>
                  <div>
                    <label>Морины эзний харъяалал</label>
                    <input type="text" placeholder="Аймаг, сум" value={hForm.ownerRegion||""} onChange={e=>setField("ownerRegion",cyrilOnly(e.target.value))}/>
                  </div>
                </div>
              </div>

              {/* Rider */}
              <div className="fcard">
                <h3>Уяач болон уралдаанч хүүхдийн мэдээлэл</h3>
                <label>Уяачийн овог нэр *</label>
                <input type="text" placeholder="Бүтэн нэр" value={hForm.uyaachName||""} onChange={e=>setField("uyaachName",cyrilOnly(e.target.value))}/>
                {hFormErr.uyaachName&&<p className="err-msg">⚠ {hFormErr.uyaachName}</p>}
                <label>Цол / Зэрэг</label>
                <input type="text" placeholder="" value={hForm.uyaachTitle||""} onChange={e=>setField("uyaachTitle",cyrilOnly(e.target.value))}/>
                <label>Уяачийн харъяалал</label>
                <input type="text" placeholder="Уяачийн аймаг, сум" value={hForm.uyaachRegion||""} onChange={e=>setField("uyaachRegion",cyrilOnly(e.target.value))}/>

                <label>Морь тавиачийн дугаар авах уу?</label>
                <div style={{display:"flex",gap:"10px",margin:"6px 0 4px"}}>
                  <button type="button"
                    onClick={()=>setField("wantsTavich",true)}
                    style={{flex:1,padding:"12px",borderRadius:"10px",border:hForm.wantsTavich===true?"1px solid var(--gold)":"1px solid var(--border-white)",
                      background:hForm.wantsTavich===true?"linear-gradient(135deg,var(--gold3),var(--gold))":"var(--white-faint)",
                      color:hForm.wantsTavich===true?"var(--navy2)":"var(--white-dim)",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:"15px",cursor:"pointer"}}>
                    Тийм
                  </button>
                  <button type="button"
                    onClick={()=>{setField("wantsTavich",false);setField("tavichName","");}}
                    style={{flex:1,padding:"12px",borderRadius:"10px",border:hForm.wantsTavich===false?"1px solid var(--gold)":"1px solid var(--border-white)",
                      background:hForm.wantsTavich===false?"linear-gradient(135deg,var(--gold3),var(--gold))":"var(--white-faint)",
                      color:hForm.wantsTavich===false?"var(--navy2)":"var(--white-dim)",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:"15px",cursor:"pointer"}}>
                    Үгүй
                  </button>
                </div>
                {hForm.wantsTavich===true && (
                  <>
                    <label>Тавиачийн овог нэр *</label>
                    <input type="text" placeholder="Бүтэн нэр" value={hForm.tavichName||""} onChange={e=>setField("tavichName",cyrilOnly(e.target.value))}/>
                    {hFormErr.tavichName&&<p className="err-msg">⚠ {hFormErr.tavichName}</p>}
                    <div style={{fontSize:"12px",color:"var(--white-dim)",marginBottom:"8px"}}>Тавиачид морины адилаар тусдаа дугаар олгогдоно.</div>
                  </>
                )}
                <label>Уралдаанч хүүхдийн овог нэр *</label>
                <input type="text" placeholder="Бүтэн нэр" value={hForm.riderName||""} onChange={e=>setField("riderName",cyrilOnly(e.target.value))}/>
                {hFormErr.riderName&&<p className="err-msg">⚠ {hFormErr.riderName}</p>}
                <label>Уралдаанч хүүхдийн сургууль</label>
                <input type="text" placeholder="Сургуулийн нэр" value={hForm.riderSchool||""} onChange={e=>setField("riderSchool",cyrilOnly(e.target.value))}/>
                <label>Уралдаанч хүүхдийн нас *</label>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"16px",margin:"6px 0 4px"}}>
                  <button type="button"
                    onClick={()=>setField("riderAge", Math.max(8, (parseInt(hForm.riderAge,10)||8) - 1))}
                    style={{width:"56px",height:"56px",borderRadius:"16px",border:"none",
                      background:"linear-gradient(135deg,var(--gold3),var(--gold))",
                      color:"var(--navy2)",fontSize:"32px",fontWeight:700,lineHeight:1,
                      cursor:"pointer",boxShadow:"0 4px 14px rgba(232,192,96,.3)"}}>
                    −
                  </button>
                  <div style={{minWidth:"70px",textAlign:"center",fontFamily:"'Poppins',sans-serif",fontSize:"34px",fontWeight:700,color:"var(--gold)"}}>
                    {hForm.riderAge||8}
                  </div>
                  <button type="button"
                    onClick={()=>setField("riderAge", Math.min(18, (parseInt(hForm.riderAge,10)||8) + 1))}
                    style={{width:"56px",height:"56px",borderRadius:"16px",border:"none",
                      background:"linear-gradient(135deg,var(--gold3),var(--gold))",
                      color:"var(--navy2)",fontSize:"32px",fontWeight:700,lineHeight:1,
                      cursor:"pointer",boxShadow:"0 4px 14px rgba(232,192,96,.3)"}}>
                    +
                  </button>
                </div>
                <div style={{textAlign:"center",fontSize:"14px",color:"var(--white-dim)",marginBottom:"4px"}}>насны доод хязгаар: 8</div>
                {hFormErr.riderAge&&<p className="err-msg">⚠ {hFormErr.riderAge}</p>}
              </div>

              <button className="btn-gold" onClick={saveHorse} disabled={isSaving}
                style={{opacity:isSaving?0.7:1,cursor:isSaving?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                {isSaving ? (
                  <>
                    <span style={{display:"inline-block",width:"14px",height:"14px",border:"2px solid rgba(2,43,120,.3)",borderTopColor:"#022b78",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                    Дугаар авч байна...
                  </>
                ) : "Хадгалаад дугаар авах ✓"}
              </button>
            </div>
          )}

          {/* ══ NUMBER REVEAL ══ */}
          {screen==="numReveal" && lastPending && (
            <div className="auth-screen">
              <div className="auth-card" style={{maxWidth:"460px"}}>
                <div style={{fontSize:"36px",marginBottom:"6px"}}>🎉</div>
                <div className="auth-title">Дугаар олгогдлоо!</div>
                <div className="auth-subtitle">
                  {lastPending.reused
                    ? "Өмнө авсан дугаараа хэрэглэнэ — үнэ төлбөргүй"
                    : "Бүртгэл баталгаажлаа — үнэ төлбөргүй"}
                </div>
                <div className="num-circle"><span className="num-big">{lastPending.number}</span><span className="num-lbl">Дугаар</span></div>

                {lastPending.tavichNumber && (
                  <div className="num-circle" style={{marginTop:"10px",background:"linear-gradient(135deg,var(--gold3),var(--gold))"}}>
                    <span className="num-big">{lastPending.tavichNumber}</span><span className="num-lbl">Тавиачийн дугаар</span>
                  </div>
                )}

                <div style={{background:"var(--white-faint)",borderRadius:"10px",padding:"12px",marginBottom:"8px",fontSize:"16px"}}>
                  {[
                    ["Морь", lastPending.horseName],
                    ["Ангилал", lastPending.ageGroupName],
                    ["Эзэн", lastPending.ownerName],
                    ["Уяач", lastPending.uyaachName||"—"],
                    ["Уралдаанч хүүхэд", lastPending.riderName],
                    ["Регистр", lastPending.riderReg||"—"],
                    ...(lastPending.tavichName ? [["Тавиач", lastPending.tavichName]] : []),
                  ].map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
                      <span style={{color:"var(--white-dim)",fontSize:"14px"}}>{l}</span>
                      <span style={{fontWeight:700,fontSize:"15px"}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(3,58,160,.6)",border:"1px solid var(--border-gold)",borderRadius:"14px",padding:"18px",textAlign:"center"}}>
                  <div style={{fontSize:"17px",fontWeight:700,color:"var(--gold)",marginBottom:"6px"}}>
                    Өөр насны ангилалд морь бүртгүүлэх үү?
                  </div>
                  <div style={{fontSize:"15px",color:"var(--white-dim)",marginBottom:"16px",lineHeight:1.5}}>
                    Тийм бол насны ангилал сонгох хуудас руу буцна.<br/>
                    Үгүй бол баталгааны хуудсаа авна.
                  </div>
                  <div style={{display:"flex",gap:"10px"}}>
                    <button className="btn-gold" style={{marginTop:0,flex:1}} onClick={afterReveal}>
                      ✓ Тийм
                    </button>
                    <button className="btn-outline" style={{flex:1}} onClick={finishRegistration}>
                      🏁 Үгүй, дуусгах
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {screen==="success" && (
            <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#022b78 0%,#012868 60%,#001233 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"20px 16px 40px"}}>

              {/* ── CONFIRMATION CARD ── */}
              <div id="success-card" style={{
                maxWidth:"400px",width:"100%",
                background:"linear-gradient(160deg,#022b78 0%,#023086 100%)",
                border:"2px solid #e8c060",borderRadius:"24px",
                padding:"0 0 20px",overflow:"hidden",
                fontFamily:"Arial,sans-serif",color:"#fff",
                boxShadow:"0 8px 40px rgba(0,0,0,.5)"
              }}>
                {/* Gold header band */}
                <div style={{background:"linear-gradient(135deg,#b8922a,#e8c060)",padding:"16px 20px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Poppins',sans-serif",fontSize:"13px",color:"#022b78",letterSpacing:"2px",marginBottom:"2px",fontWeight:700}}>
                    ҮНДЭСНИЙ ИХ БАЯР НААДАМ 2026
                  </div>
                  <div style={{fontFamily:"'Poppins',sans-serif",fontSize:"20px",color:"#022b78",fontWeight:700}}>
                    БҮРТГЭЛ БАТАЛГААЖЛАА ✓
                  </div>
                </div>

                {/* Owner info */}
                <div style={{padding:"14px 20px 0",textAlign:"center"}}>
                  <div style={{fontSize:"14px",color:"rgba(255,255,255,.5)",marginBottom:"2px"}}>ЭЗЭН</div>
                  <div style={{fontSize:"18px",fontWeight:700,color:"#fff"}}>{user?.name}</div>
                </div>

                {/* Horse cards */}
                <div style={{padding:"12px 16px 0"}}>
                  {flatHorses.filter(h=>h.paid&&h.ownerPhone===user?.phone).map((h,idx)=>(
                    <div key={h.id} style={{
                      background:"rgba(255,255,255,.07)",
                      border:"1px solid rgba(232,192,96,.35)",
                      borderRadius:"16px",padding:"14px 16px",
                      marginBottom:"10px"
                    }}>
                      {/* Big number */}
                      <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                        <div style={{
                          width:"72px",height:"72px",borderRadius:"50%",flexShrink:0,
                          background:"linear-gradient(135deg,#b8922a,#e8c060)",
                          display:"flex",flexDirection:"column",
                          alignItems:"center",justifyContent:"center",
                          boxShadow:"0 0 20px rgba(232,192,96,.4)"
                        }}>
                          <span style={{fontFamily:"'Poppins',sans-serif",fontSize:h.number>99?"20px":"26px",fontWeight:700,color:"#022b78",lineHeight:1}}>{h.number}</span>
                          <span style={{fontSize:"10px",color:"#022b78",fontWeight:700,letterSpacing:"1px",marginTop:"2px"}}>ДУГААР</span>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:"18px",marginBottom:"4px"}}>{h.horseName}</div>
                          <div style={{display:"inline-block",background:"rgba(232,192,96,.15)",border:"1px solid rgba(232,192,96,.3)",borderRadius:"6px",padding:"2px 8px",fontSize:"13px",color:"#f5d882",marginBottom:"6px"}}>{h.ageGroupName}</div>
                          <div style={{fontSize:"14px",color:"rgba(255,255,255,.6)",lineHeight:1.6}}>
                            Уяач: {h.uyaachName||"—"}<br/>
                            Уралдаанч: {h.riderName}{h.riderAge?` · ${h.riderAge} нас`:""}
                            {h.tavichNumber && <><br/>Тавиач: {h.tavichName} · Дугаар #{h.tavichNumber}</>}
                          </div>
                        </div>
                      </div>
                      {h.reused && (
                        <div style={{marginTop:"8px",fontSize:"13px",color:"#2ecc71",padding:"4px 8px",background:"rgba(39,174,96,.1)",borderRadius:"6px",textAlign:"center"}}>
                          ✓ Ижил дугаар ашиглав
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Important instruction */}
                <div style={{margin:"4px 16px 0",background:"rgba(232,192,96,.1)",border:"1px solid rgba(232,192,96,.3)",borderRadius:"12px",padding:"12px 14px",textAlign:"center"}}>
                  <div style={{fontSize:"15px",fontWeight:700,color:"#e8c060",marginBottom:"4px"}}>⚠️ ЧУХАЛ МЭДЭЭЛЭЛ</div>
                  <div style={{fontSize:"14px",color:"rgba(255,255,255,.75)",lineHeight:1.6}}>
                    Энэ баримтыг цамц/хантааз авахдаа үзүүлнэ үү.<br/>
                    Дугаартай цамцаа авахдаа дээрх <strong style={{color:"#e8c060"}}>дугаараа</strong> заана уу.
                  </div>
                </div>
              </div>

              {/* ── SAVE BUTTON ── */}
              <div style={{maxWidth:"400px",width:"100%",marginTop:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
                <button style={{
                  width:"100%",background:"linear-gradient(135deg,#b8922a,#e8c060)",
                  border:"none",borderRadius:"14px",padding:"16px",
                  color:"#022b78",fontFamily:"'Poppins',sans-serif",fontSize:"18px",
                  fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",
                  justifyContent:"center",gap:"10px",boxShadow:"0 4px 20px rgba(232,192,96,.3)"
                }}
                  onClick={async()=>{
                    const el=document.getElementById("success-card");
                    if(!el) return;
                    if(!window.html2canvas){
                      await new Promise((res,rej)=>{
                        const s=document.createElement("script");
                        s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                        s.onload=res; s.onerror=rej;
                        document.head.appendChild(s);
                      });
                    }
                    try {
                      showToast("Зураг бэлдэж байна...");
                      const canvas = await window.html2canvas(el,{
                        backgroundColor:"#022b78",scale:3,useCORS:true,logging:false
                      });
                      const nums=flatHorses.filter(h=>h.paid&&h.ownerPhone===user?.phone).map(h=>h.number).join("-");
                      const fileName=`Монгол_Улсын_Наадам_${nums}.png`;
                      const dataUrl = canvas.toDataURL("image/png");

                      // Detect platform
                      const ua = navigator.userAgent || "";
                      const isAndroid = /Android/i.test(ua);
                      const isIOS = /iPhone|iPad|iPod/i.test(ua);

                      if (isIOS && navigator.share) {
                        // iOS: Web Share API works reliably and opens "Save Image" sheet
                        canvas.toBlob(async(blob)=>{
                          try {
                            await navigator.share({
                              title:"Үндэсний Их Баяр Наадам 2026",
                              files:[new File([blob],fileName,{type:"image/png"})]
                            });
                            showToast("✓ Хадгалагдлаа!");
                          } catch(e){
                            if(e.name!=="AbortError"){
                              const link=document.createElement("a");
                              link.href=dataUrl; link.download=fileName;
                              document.body.appendChild(link); link.click(); document.body.removeChild(link);
                              showToast("✓ Татаж авлаа!");
                            }
                          }
                        },"image/png");
                      } else {
                        // Android & Desktop: direct download is most reliable.
                        // On Android Chrome this saves straight into the Gallery/Photos via Downloads.
                        const link=document.createElement("a");
                        link.href=dataUrl; link.download=fileName;
                        document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        if (isAndroid) {
                          showToast("✓ Татагдлаа! Зургийн апп → Татсан зургууд");
                        } else {
                          showToast("✓ Татаж авлаа!");
                        }
                      }
                    } catch(e){ console.error(e); window.print(); }
                  }}>
                  📥 Хадгалах
                </button>
                {/* Plain-language help for older/less tech-savvy users */}
                <div style={{fontSize:"14px",color:"rgba(255,255,255,.45)",textAlign:"center",lineHeight:1.6,padding:"0 8px"}}>
                  📱 Зураг "Татсан файлууд" (Downloads) хавтсанд хадгалагдана.<br/>
                  Утасныхаа <strong>Зургийн апп (Gallery/Photos)</strong> нээгээд <strong>"Татсан зургууд"</strong> эсвэл <strong>"Downloads"</strong> цомгийг шалгана уу.
                </div>
                <button style={{
                  width:"100%",background:"transparent",
                  border:"1px solid rgba(255,255,255,.2)",borderRadius:"14px",padding:"13px",
                  color:"rgba(255,255,255,.6)",fontFamily:"'Poppins',sans-serif",
                  fontSize:"16px",fontWeight:600,cursor:"pointer"
                }} onClick={()=>goNav("dashboard","dashboard")}>
                  Нүүр хуудас руу →
                </button>
              </div>
            </div>
          )}

          {/* ══ EXPLAINER ══ */}
          {screen==="explainer" && (
            <div className="page">
              <div style={{background:"rgba(3,58,160,.5)",border:"1px solid var(--border-gold)",borderRadius:"14px",padding:"16px 20px",marginBottom:"18px",display:"flex",alignItems:"center",gap:"12px"}}>
                <div className="live-dot"/>
                <div>
                  <div style={{fontFamily:"'Poppins',sans-serif",color:"var(--gold)",fontSize:"17px",marginBottom:"2px"}}>🎙 Тайлбарлагчийн Самбар</div>
                  <div style={{fontSize:"14px",color:"var(--white-dim)"}}>Бүртгэлтэй морьдын мэдээлэл · Дугаар · Насны ангилал</div>
                </div>
                <div style={{marginLeft:"auto",fontFamily:"'Poppins',sans-serif",fontSize:"22px",color:"var(--gold)"}}>{flatHorses.length}</div>
              </div>

              {/* Search box */}
              <div style={{position:"relative",marginBottom:"14px"}}>
                <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"18px",pointerEvents:"none"}}>🔍</span>
                <input
                  type="text"
                  placeholder="Дугаар, морины нэр, уяач, уралдаанч хайх..."
                  value={expSearch}
                  onChange={e=>setExpSearch(e.target.value)}
                  style={{paddingLeft:"40px",background:"rgba(3,58,160,.6)",border:"1px solid var(--border-gold)"}}
                />
                {expSearch && (
                  <button onClick={()=>setExpSearch("")}
                    style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--white-dim)",fontSize:"20px",cursor:"pointer",lineHeight:1}}>×</button>
                )}
              </div>

              <div className="filter-bar">
                <button className={`chip ${expFilter==="all"?"active":""}`} onClick={()=>setExpFilter("all")}>Бүгд ({flatHorses.length})</button>
                {AGE_GROUPS.filter(ag=>(allReg[ag.id]||[]).length>0).map(ag=>(
                  <button key={ag.id} className={`chip ${expFilter===ag.id?"active":""}`} onClick={()=>setExpFilter(ag.id)}>
                    {ag.name} ({(allReg[ag.id]||[]).length})
                  </button>
                ))}
              </div>

              {flatHorses.length===0
                ? <div className="empty-state"><div className="big">📋</div><div>Одоохондоо бүртгэлтэй морь байхгүй байна</div></div>
                : <div className="horse-grid">
                    {flatHorses
                      .filter(h=>{
                        const ageOk = expFilter==="all" || h.ageGroupId===expFilter;
                        if (!expSearch.trim()) return ageOk;
                        const q = expSearch.trim().toLowerCase();
                        return ageOk && (
                          String(h.number).includes(q) ||
                          (h.horseName||"").toLowerCase().includes(q) ||
                          (h.uyaachName||"").toLowerCase().includes(q) ||
                          (h.riderName||"").toLowerCase().includes(q) ||
                          (h.ownerName||"").toLowerCase().includes(q) ||
                          (h.ageGroupName||"").toLowerCase().includes(q)
                        );
                      })
                      .sort((a,b)=>a.number-b.number)
                      .map(h=>(
                        <div key={h.id} className="exp-card" onClick={()=>setExpHorse(h)}>
                          <div className="exp-img">
                            {h.horseImage?<img src={h.horseImage} alt={h.horseName} style={{width:"100%",height:"100%",objectFit:"contain",background:"rgba(0,0,0,0.2)"}}/>:<span style={{fontSize:'32px',opacity:.5}}>🐴</span>}
                            <span className="num-badge">{h.number}</span>
                          </div>
                          <div className="exp-body">
                            <div className="exp-name">{h.horseName}</div>
                            <div className="exp-meta">
                              <span className="tag">{h.ageGroupName}</span><br/>
                              Эзэн: {h.ownerName}<br/>
                              Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
              }
              {flatHorses.length>0 && expSearch.trim() && flatHorses.filter(h=>{
                const ageOk=expFilter==="all"||h.ageGroupId===expFilter;
                const q=expSearch.trim().toLowerCase();
                return ageOk&&(String(h.number).includes(q)||(h.horseName||"").toLowerCase().includes(q)||(h.uyaachName||"").toLowerCase().includes(q)||(h.riderName||"").toLowerCase().includes(q)||(h.ownerName||"").toLowerCase().includes(q));
              }).length===0 && (
                <div className="empty-state" style={{padding:"30px"}}>
                  <div style={{fontSize:"34px",marginBottom:"8px"}}>🔍</div>
                  <div>"{expSearch}" хайлтад тохирох морь олдсонгүй</div>
                </div>
              )}
            </div>
          )}

          {/* ══ ADMIN ══ */}
          {screen==="admin" && role==="admin" && (
            <div className="page">
              <div className="banner" style={{marginBottom:"18px"}}>
                <h2>🔐 Админы Самбар</h2>
                <p>Бүх бүртгэл, төлбөр, хэрэглэгчдийн мэдээллийг энд удирдана уу.</p>
                <div className="stats-row">
                  <div className="stat-card"><div className="stat-val">{flatHorses.length}</div><div className="stat-label">Нийт морь</div></div>
                  <div className="stat-card"><div className="stat-val">{Math.max(0,MAX_HORSES-issuedCount)}</div><div className="stat-label">Үлдсэн дугаар</div></div>
                  <div className="stat-card"><div className="stat-val">{MAX_HORSES}</div><div className="stat-label">Нийт багтаамж</div></div>
                </div>
              </div>

              <div className="admin-tabs">
                {[["overview","📊 Ерөнхий"],["horses"," Бүртгэлүүд"],["byage","📋 Насны ангилал"],["export","📥 Экспорт"],["settings","⚙️ Тохиргоо"]].map(([k,l])=>(
                  <button key={k} className={`adm-tab ${adminTab===k?"active":""}`} onClick={()=>setAdminTab(k)}>{l}</button>
                ))}
              </div>

              {/* Overview */}
              {adminTab==="overview" && (
                <>
                  <div className="sec-title">Насны ангиллаар</div>
                  {AGE_GROUPS.map(ag=>{
                    const cnt=(allReg[ag.id]||[]).length;
                    const paid=(allReg[ag.id]||[]).filter(h=>h.paid).length;
                    return (
                      <div key={ag.id} className="adm-card" style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"8px"}}>
                        <span style={{fontFamily:"'Poppins',sans-serif",fontSize:"22px",color:"var(--gold)",minWidth:"28px"}}>#{ag.id}</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:"16px",color:"var(--gold)"}}>{ag.name}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:"20px",color:"var(--gold)"}}>{cnt}</div>
                          <div style={{fontSize:"13px",color:"var(--white-dim)"}}>{paid} төлсөн</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* All Horses */}
              {adminTab==="horses" && (
                <>
                  <div className="sec-title">Бүх Бүртгэлүүд ({flatHorses.length})</div>
                  {flatHorses.length===0
                    ? <div className="empty-state"><div className="big">📋</div><div>Бүртгэл байхгүй байна</div></div>
                    : flatHorses.sort((a,b)=>a.number-b.number).map(h=>(
                      <div key={h.id} className="horse-item" onClick={()=>setAdminHorse(h)}>
                        <div className="horse-num">{h.number}</div>
                        <div>
                          <div className="horse-name">{h.horseName} <span className="tag">{h.ageGroupName}</span></div>
                          <div className="horse-meta">Эзэн: {h.ownerName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div>
                        </div>
                        <span className="status-paid">✓ Баталгаажсан</span>
                      </div>
                    ))
                  }
                </>
              )}

              {/* By Age Group */}
              {adminTab==="byage" && (
                <>
                  {AGE_GROUPS.map(ag=>{
                    const horses=allReg[ag.id]||[];
                    if(horses.length===0)return null;
                    return (
                      <div key={ag.id} style={{marginBottom:"20px"}}>
                        <div className="sec-title">{ag.name}</div>
                        {horses.map(h=>(
                          <div key={h.id} className="horse-item" onClick={()=>setAdminHorse(h)}>
                            <div className="horse-num">{h.number}</div>
                            <div><div className="horse-name">{h.horseName}</div><div className="horse-meta">Эзэн: {h.ownerName} · Уяач: {h.uyaachName||"—"} · Уралдаанч: {h.riderName}</div></div>
                            <div style={{display:"flex",flexDirection:"column",gap:"4px",alignItems:"flex-end",marginLeft:"auto"}}>
                              <span style={{fontSize:"13px",color:"var(--green-t)"}}>✓ Баталгаажсан</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {flatHorses.length===0&&<div className="empty-state"><div className="big">📋</div><div>Бүртгэл байхгүй байна</div></div>}
                </>
              )}

              {/* Export */}
              {adminTab==="export" && (
                <div>
                  <div className="sec-title">CSV / Excel экспорт</div>

                  {/* Full export */}
                  <div className="adm-card" style={{marginBottom:"12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:"17px",marginBottom:"4px"}}>📥 Бүх бүртгэл</div>
                        <div style={{fontSize:"15px",color:"var(--white-dim)"}}>Нийт {flatHorses.length} морь · Бүх насны ангилал</div>
                      </div>
                      <button onClick={exportCSV}
                        style={{background:"linear-gradient(135deg,var(--gold3),var(--gold))",border:"none",borderRadius:"10px",padding:"11px 22px",color:"var(--navy2)",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                        📥 CSV татаж авах
                      </button>
                    </div>
                  </div>

                  {/* Export by age group */}
                  <div className="sec-title">Насны ангиллаар тусад нь</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {AGE_GROUPS.map(ag=>{
                      const cnt = flatHorses.filter(h=>h.ageGroupId===ag.id).length;
                      return (
                        <div key={ag.id} className="adm-card" style={{padding:"12px 16px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"10px"}}>
                            <div>
                              <span style={{fontWeight:700,fontSize:"16px"}}>{ag.name}</span>
                              <span style={{fontSize:"14px",color:"var(--white-dim)",marginLeft:"10px"}}>{cnt} морь</span>
                            </div>
                            {cnt > 0 ? (
                              <button onClick={()=>exportByAge(ag.id)}
                                style={{background:"var(--gold-bg)",border:"1px solid var(--border-gold)",borderRadius:"8px",padding:"7px 16px",color:"var(--gold)",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:"14px",cursor:"pointer"}}>
                                📥 CSV
                              </button>
                            ) : (
                              <span style={{fontSize:"14px",color:"rgba(255,255,255,.3)"}}>Бүртгэл байхгүй</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{marginTop:"16px",padding:"12px 14px",background:"rgba(232,192,96,.06)",border:"1px solid var(--border-gold)",borderRadius:"10px",fontSize:"14px",color:"var(--white-dim)",lineHeight:1.6}}>
                    💡 CSV файлыг Excel-д нээхдээ: Excel → Data → From Text/CSV → UTF-8 encoding сонгоно уу. Эсвэл Google Sheets-д шууд upload хийж болно.
                  </div>
                </div>
              )}

              {/* Settings */}
              {adminTab==="settings" && (
                <div className="adm-card">
                  <h3 style={{fontFamily:"'Poppins',sans-serif",color:"var(--gold)",marginBottom:"14px",paddingBottom:"10px",borderBottom:"1px solid var(--border-gold)"}}>Системийн тохиргоо</h3>
                  {[
                    ["Тайлбарлагчийн нэвтрэх код","tailbar2026"],
                    ["Төлбөрийн систем","Үнэ төлбөргүй — шаардлагагүй"],
                    ["Нийт боломжит дугаар","1 – 1,500"],
                    ["Бүртгэлийн хураамж","Үнэгүй"],
                    ["Системийн хувилбар","Үндэсний Их Баяр Наадам v1.0"],
                  ].map(([l,v])=>(
                    <div key={l} className="adm-row">
                      <span className="adm-label">{l}</span>
                      <span style={{fontFamily:"'Poppins',sans-serif",color:"var(--gold)",fontSize:"16px"}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* ── EXPLAINER HORSE MODAL ── */}
        {expHorse && (
          <div className="overlay" onClick={()=>setExpHorse(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-title">
                <span> #{expHorse.number} · {expHorse.horseName}</span>
                <button className="modal-close" onClick={()=>setExpHorse(null)}>×</button>
              </div>
              {expHorse.horseImage&&<img src={expHorse.horseImage} style={{width:"100%",maxHeight:"260px",objectFit:"contain",background:"rgba(0,0,0,0.2)",borderRadius:"9px",marginBottom:"14px"}} alt="horse"/>}
              {[
                ["Дугаар",expHorse.number],
                ["Насны ангилал",expHorse.ageGroupName],
                ["Морины нэр",expHorse.horseName],
                ["Өнгө",expHorse.horseColor||"—"],
                ["Эзний нэр",expHorse.ownerName],
                ["Эзний цол",expHorse.ownerTitle||"—"],
                ["Уяачийн нэр",expHorse.uyaachName||"—"],

                ["Уралдаанч хүүхдийн нэр",expHorse.riderName],
                ["Уралдаанч хүүхдийн нас",expHorse.riderAge||(expHorse.riderReg&&expHorse.riderReg.length===10?`~${2026-parseInt(expHorse.riderReg.slice(2,4)<=26?2000+parseInt(expHorse.riderReg.slice(2,4)):1900+parseInt(expHorse.riderReg.slice(2,4)))} нас`:"—")||"—"],
                ["Өмнөх амжилт/ түүх",expHorse.history||"—"],
              ].map(([l,v])=>(
                <div key={l} className="detail-row"><span className="detail-lbl">{l}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADMIN HORSE MODAL ── */}
        {adminHorse && (
          <div className="overlay" onClick={()=>setAdminHorse(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div className="modal-title">
                <span> #{adminHorse.number} · {adminHorse.horseName}</span>
                <button className="modal-close" onClick={()=>setAdminHorse(null)}>×</button>
              </div>
              {adminHorse.horseImage&&<img src={adminHorse.horseImage} style={{width:"100%",maxHeight:"260px",objectFit:"contain",background:"rgba(0,0,0,0.2)",borderRadius:"9px",marginBottom:"14px"}} alt="horse"/>}
              {/* Payment verification box */}
              <div style={{
                background: adminHorse.approved
                  ? "rgba(39,174,96,.12)"
                  : adminHorse.paid
                    ? "rgba(232,192,96,.1)"
                    : "rgba(192,57,43,.1)",
                border: `1px solid ${adminHorse.approved ? "rgba(39,174,96,.4)" : adminHorse.paid ? "var(--border-gold)" : "rgba(192,57,43,.35)"}`,
                borderRadius:"12px", padding:"14px 16px", marginBottom:"16px"
              }}>
                <div style={{fontSize:"14px",color:"var(--white-dim)",marginBottom:"8px",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px"}}>
                  ✅ Баталгаажсан
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                  <div>
                    <div style={{fontSize:"13px",color:"var(--white-dim)"}}>Бүртгэлийн дугаар</div>
                    <div style={{fontFamily:"'Poppins',sans-serif",fontSize:"26px",color:"var(--gold)",fontWeight:700}}>{adminHorse.number}</div>
                  </div>
                  <div>
                    <div style={{fontSize:"13px",color:"var(--white-dim)"}}>Төлбөр</div>
                    <div style={{fontFamily:"'Poppins',sans-serif",fontSize:"20px",color:"#2ecc71",fontWeight:700}}>
                      Үнэгүй
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:"13px",color:"var(--white-dim)"}}>Эзний утас</div>
                    <div style={{fontSize:"16px",fontWeight:700}}>{adminHorse.ownerPhone||"—"}</div>
                  </div>
                  <div>
                    <div style={{fontSize:"13px",color:"var(--white-dim)"}}>Даатгалын дугаар</div>
                    <div style={{fontSize:"16px",fontWeight:700}}>***{adminHorse.insurance||"—"}</div>
                  </div>
                </div>
              </div>

              {[
                ["Морины нэр",adminHorse.horseName],
                ["Насны ангилал",adminHorse.ageGroupName],
                ["Өнгө",adminHorse.horseColor||"—"],
                ["Эзний нэр",adminHorse.ownerName],
                ["Эзний цол",adminHorse.ownerTitle||"—"],
                ["Уяачийн нэр",adminHorse.uyaachName||"—"],
                ["Уралдаанч хүүхдийн нэр",adminHorse.riderName],["Уралдаанчийн сургууль",adminHorse.riderSchool||"—"],
                ["Уралдаанчийн нас",adminHorse.riderAge||"—"],
                ["Тавиач",adminHorse.tavichName ? `${adminHorse.tavichName} (Дугаар #${adminHorse.tavichNumber})` : "—"],
                ["Өмнөх амжилт/ түүх",adminHorse.history||"—"],
              ].map(([l,v])=>(
                <div key={l} className="detail-row"><span className="detail-lbl">{l}</span><span>{v}</span></div>
              ))}

              <div style={{display:"flex",gap:"8px",marginTop:"16px"}}>
                <div style={{flex:1,textAlign:"center",padding:"12px",background:"rgba(39,174,96,.12)",border:"1px solid rgba(39,174,96,.3)",borderRadius:"10px",color:"#2ecc71",fontWeight:700,fontSize:"16px"}}>
                  ✅ Баталгаажсан
                </div>
                <button style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"10px",padding:"12px",color:"rgba(255,255,255,.4)",fontFamily:"'Poppins',sans-serif",fontSize:"15px",cursor:"pointer"}} onClick={()=>setAdminHorse(null)}>Хаах</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}

// ── EYE TOGGLE PASSWORD INPUT ───────────────────────────────────────────────
function EyeInput({id, placeholder, style={}}) {
  const [show, setShow] = useState(false);
  return (
    <div className="pass-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        style={{letterSpacing: show ? "normal" : "4px", ...style}}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={()=>setShow(s=>!s)}
        tabIndex={-1}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

// ── PHONE INPUT GRID COMPONENT ──────────────────────────────────────────────
function PhoneGrid({id}){
  const [digits, setDigits] = useState(["","","","","","","",""]);
  const refs = Array.from({length:8},()=>useRef());

  const handleChange=(i,v)=>{
    const d=v.replace(/\D/g,"").slice(0,1);
    const next=[...digits]; next[i]=d; setDigits(next);
    // Write combined value to hidden input
    const combined=next.join("");
    const hidden=document.getElementById(id);
    if(hidden) hidden.value=combined;
    if(d && i<7) refs[i+1].current?.focus();
  };

  const handleKey=(i,e)=>{
    if(e.key==="Backspace"&&!digits[i]&&i>0){
      const next=[...digits]; next[i-1]=""; setDigits(next);
      const combined=next.join("");
      const hidden=document.getElementById(id);
      if(hidden) hidden.value=combined;
      refs[i-1].current?.focus();
    }
    if(e.key==="Enter"){
      // trigger the nearest button
      const btn=e.target.closest("form,div")?.querySelector(".btn-gold");
      btn?.click();
    }
  };

  const handlePaste=(e)=>{
    e.preventDefault();
    const pasted=e.clipboardData.getData("text").replace(/\D/g,"").slice(0,8);
    const next=Array.from({length:8},(_,i)=>pasted[i]||"");
    setDigits(next);
    const hidden=document.getElementById(id);
    if(hidden) hidden.value=next.join("");
    const lastFilled=Math.min(pasted.length,7);
    refs[lastFilled].current?.focus();
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:"6px",margin:"4px 0 2px"}}>
      {digits.map((d,i)=>(
        <input key={i} ref={refs[i]}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e=>handleChange(i,e.target.value)}
          onKeyDown={e=>handleKey(i,e)}
          onPaste={handlePaste}
          style={{
            height:"48px",textAlign:"center",fontSize:"22px",fontWeight:700,
            background:d?"rgba(232,192,96,.15)":"var(--white-faint)",
            border:`2px solid ${d?"var(--gold)":"var(--border-white)"}`,
            borderRadius:"10px",color:"var(--white)",outline:"none",
            fontFamily:"'Poppins',sans-serif",transition:"all .2s",padding:0,width:"100%"
          }}
        />
      ))}
    </div>
  );
}

// ── PHONE INPUT GRID COMPONENT ──────────────────────────────────────────────

// ── USER AUTH SUB-COMPONENT ─────────────────────────────────────────────────
function UserAuth({doRegister,doLogin}){
  const [mode,setMode]=useState("register");
  const [rs,setRs]=useState(""); const [rn,setRn]=useState("");
  const [ls,setLs]=useState(""); const [ln,setLn]=useState("");
  const [latinWarn,setLatinWarn]=useState(false);
  const warnTimer=useState(null);

  const filterCyril=(v,setter)=>{
    if(/[A-Za-zÀ-ɏ]/.test(v)){
      setLatinWarn(true);
      clearTimeout(warnTimer[0]);
      warnTimer[0]=setTimeout(()=>setLatinWarn(false),3000);
    }
    return v.replace(/[^\u0400-\u04FF\s]/gu,"");
  };

  return (
    <>
      <div style={{display:"flex",gap:"6px",marginBottom:"16px"}}>
        <button className={`tab-btn ${mode==="register"?"active":""}`} style={{fontSize:"14px"}} onClick={()=>setMode("register")}>Бүртгүүлэх</button>
        <button className={`tab-btn ${mode==="login"?"active":""}`} style={{fontSize:"14px"}} onClick={()=>setMode("login")}>Нэвтрэх</button>
      </div>

      {latinWarn && (
        <div style={{background:"rgba(192,57,43,.15)",border:"1px solid rgba(192,57,43,.4)",
          borderRadius:"10px",padding:"10px 14px",marginBottom:"10px",
          fontSize:"15px",color:"#ff8a80",display:"flex",gap:"8px",alignItems:"center"}}>
          <span>⚠️</span> Та зөвхөн Монгол кирилл үсгээр бичнэ үү
        </div>
      )}

      {mode==="register" ? <>
        <label>Овог:</label>
        <input type="text" placeholder="Овог" maxLength={40} value={rs}
          onChange={e=>{const v=filterCyril(e.target.value,setRs);setRs(v);}}/>
        <input id="rs" type="hidden" value={rs} readOnly/>
        <label>Нэр:</label>
        <input type="text" placeholder="Нэр" maxLength={40} value={rn}
          onChange={e=>{const v=filterCyril(e.target.value,setRn);setRn(v);}}/>
        <input id="rn" type="hidden" value={rn} readOnly/>
        <label>Гар утасны дугаар:</label>
        <PhoneGrid id="rp"/>
        <input id="rp" type="hidden"/>
        <button className="btn-gold" onClick={doRegister}>Нэвтрэх →</button>
      </> : <>
        <div style={{background:"rgba(232,192,96,.08)",border:"1px solid var(--border-gold)",borderRadius:"10px",padding:"12px 14px",marginBottom:"4px",fontSize:"15px",color:"rgba(255,255,255,.7)",lineHeight:1.6}}>
          📱 Бүртгүүлэхдээ ашигласан <strong style={{color:"var(--gold)"}}>утасны дугаараа</strong> оруулна уу
        </div>
        <label>Гар утасны дугаар:</label>
        <PhoneGrid id="lp"/>
        <input id="lp" type="hidden"/>
        <button className="btn-gold" onClick={doLogin}>Нэвтрэх →</button>
      </>}
    </>
  );
}
