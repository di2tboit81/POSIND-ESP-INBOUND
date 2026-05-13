
var firebaseConfig = {
    apiKey: "AIzaSyBQeh3uUSQu69VXyslaqyPQ6cR8eX5M5s4",
    authDomain: "win-29400.firebaseapp.com",
    databaseURL: "https://win-29400-default-rtdb.firebaseio.com",
    projectId: "win-29400",
    storageBucket: "win-29400.firebasestorage.app",
    messagingSenderId: "186236557243",
    appId: "1:186236557243:web:1e26f6848dd917a4cb969e"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();




function getTanggalJamFile(){
    let now = new Date();

    let tgl = ("0"+now.getDate()).slice(-2) +
              ("0"+(now.getMonth()+1)).slice(-2) +
              now.getFullYear();

    let jam = ("0"+now.getHours()).slice(-2) +
              ("0"+now.getMinutes()).slice(-2) +
              ("0"+now.getSeconds()).slice(-2);

    return tgl + "_" + jam;
}

// ===== TAMBAHAN UNTUK TAMPILKAN DATA TERAKHIR (SCAN & MANUAL) =====
(function(){

    // Simpan fungsi asli
    const originalProses = prosesBarcode;

    // Override tanpa mengubah isi lama
    prosesBarcode = function(barcode){

        // Panggil fungsi lama dulu
        originalProses(barcode);

        // Jika berhasil masuk ke array, tampilkan sebagai data terakhir
        if(scannedBarcodes.includes(barcode)){
            document.getElementById("lastScan").innerHTML =
                "✅ Data Terakhir : <span style='color:#FF6A00'>" + barcode + "</span>";
        }

    };

})();

function updateScanCounter(){
    document.getElementById("scanCounter").innerText =
        "Total Scan Berhasil : " + scannedBarcodes.length; 
}

let scannedBarcodes=[];
let dataBerat = {};
document.getElementById("tanggal").value=
new Date().toISOString().split("T")[0];

function beep(url){ new Audio(url).play(); }

function showNotif(text,type){
let n=document.getElementById("notif");
n.innerText=text;
n.className=type;
setTimeout(()=>{n.innerText="";},3000);
}

function prosesBarcode(barcode){

// ===== VALIDASI FORMAT BARCODE FUTURE PROOF =====

// Format ESP lama
const regexESP = /^(DWB20\d{2}[A-Za-z0-9]{4,6}|TO20\d{2}[A-Za-z0-9]{9})$/i;

// Format LOST baru (13-14 karakter)
// contoh: LOST2026XXXXXX atau LOST2027XXXXX
const regexLOST = /^LOST20(25|26|27|28|29|30)[A-Za-z0-9]{4,6}$/i;

// Gabungkan validasi
if(!regexESP.test(barcode) && !regexLOST.test(barcode)){

    efekErrorKuat();

    beep("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");

    let n = document.getElementById("notif");

    n.innerHTML = "⚠️ BUKAN NO KANTONG ESP-POSIND";

    n.style.color = "#FF6A00";
    n.style.fontWeight = "900";
    n.style.fontSize = "22px";
    n.style.letterSpacing = "2px";

    n.style.textShadow =
        "0 0 10px #FF6A00," +
        "0 0 20px #FF6A00," +
        "0 0 40px #FF6A00," +
        "0 0 60px rgba(255,106,0,0.9)";

    n.style.animation = "cyberFlash 0.8s infinite alternate";

    setTimeout(()=>{
        n.innerHTML="";
        n.style.animation="";
    },3500);

    return;
}

if(scannedBarcodes.includes(barcode)){

efekErrorKuat();

beep("https://actions.google.com/sounds/v1/alarms/winding_alarm_clock.ogg");
showNotif("❌ Kantong sudah ada!","error");
return;
}

let penerima=document.getElementById("penerima").value;
let penyerah=document.getElementById("penyerah").value;

if(!penerima||!penyerah){
alert("Isi nama penerima & penyerah dulu!");
return;
}

tampilPopupBerat(barcode);
}

function onScanSuccess(decodedText){

if(scanLock) return;

// anti scan sama berturut
if(decodedText === lastBarcode && scanLock) return;

scanLock = true;
lastBarcode = decodedText;

document.getElementById("lastScan").innerText =
"Scan Berhasil: " + decodedText;

prosesBarcode(decodedText);

// jeda scan
setTimeout(()=>{
scanLock = false;
},1200);

}

// ===== SCANNER GUDANG PRO ENGINE =====

let scanLock = false;
let lastBarcode = "";
let scannerRunning = false;

const html5QrCode = new Html5Qrcode("reader");

async function startScanner(){

if(scannerRunning){
await html5QrCode.stop().catch(()=>{});
scannerRunning = false;
}

try{

await html5QrCode.start(
{ facingMode: "environment" },
{
fps:7,
qrbox:{ width:220, height:220 },
aspectRatio:1.0,
disableFlip:false
},
onScanSuccess
);

scannerRunning = true;
showNotif("📷 Camera aktif","success");

// 🔥 TAMBAHAN INI
setTimeout(()=>{
autoFlash();
},800);

}catch(err){
console.log(err);
showNotif("Camera gagal aktif","error");
}

}

async function stopScanner(){

if(!scannerRunning) return;

try{

await html5QrCode.stop();
scannerRunning = false;

showNotif("📷 Camera dihentikan","error");

}catch(err){
console.log(err);
}

}

async function restartScanner(){

try{

// paksa stop dulu
await html5QrCode.stop().catch(()=>{});

scannerRunning = false;

// tunggu kamera benar-benar dilepas
setTimeout(async ()=>{

await startScanner();

},1200);

showNotif("🔄 Camera Restart","success");

}catch(err){

console.log(err);
showNotif("Restart gagal","error");

}

}

// AUTO START
startScanner();

// ===== AUTO FLASH HP =====

setTimeout(async ()=>{

try{

const video = document.querySelector("#reader video");

if(!video) return;

const track = video.srcObject.getVideoTracks()[0];

const cap = track.getCapabilities();

if(cap.torch){

await track.applyConstraints({
advanced:[{torch:true}]
});

console.log("Flash Aktif 🔦");

}

}catch(e){
console.log("Flash tidak tersedia");
}

},2000);

// AUTO AKTIFKAN FLASH HP
setTimeout(async () => {

try{

const video = document.querySelector("#reader video");

if(!video) return;

const stream = video.srcObject;

if(!stream) return;

const track = stream.getVideoTracks()[0];

const capabilities = track.getCapabilities();

if(capabilities.torch){

await track.applyConstraints({
advanced:[{torch:true}]
});

console.log("Flash Aktif 🔦");

}

}catch(e){
console.log("Flash tidak didukung");
}

},2000);

// ===== AUTO FLASH (TORCH) SAAT SCAN DI HP =====
let currentCameraTrack = null;
async function autoFlash(){

try{

const video = document.querySelector("#reader video");
if(!video) return;

const stream = video.srcObject;
if(!stream) return;

const track = stream.getVideoTracks()[0];

currentCameraTrack = track;

const capabilities = track.getCapabilities();

if(capabilities.torch){

await track.applyConstraints({
advanced:[{torch:true}]
});

console.log("Flash ON 🔦");

}

}catch(err){
console.log("Flash tidak didukung");
}

}

// Ambil kamera setelah scanner aktif
setTimeout(async () => {
    try {
        const video = document.querySelector("#reader video");
        if (video && video.srcObject) {
            const stream = video.srcObject;
            const track = stream.getVideoTracks()[0];
            currentCameraTrack = track;

            const capabilities = track.getCapabilities();

            if (capabilities.torch) {
                await track.applyConstraints({
                    advanced: [{ torch: true }]
                });
                console.log("Flash ON 🔦");
            }
        }
    } catch (err) {
        console.log("Flash tidak didukung di perangkat ini");
    }
}, 1500);

// Matikan flash saat scanner clear
function matikanFlash() {

// ===== TOGGLE FLASH MANUAL =====
let flashStatus = false;

async function toggleFlash() {

    if (!currentCameraTrack) {
        showNotif("Flash tidak tersedia di perangkat ini","error");
        return;
    }

    try {
        flashStatus = !flashStatus;

        await currentCameraTrack.applyConstraints({
            advanced: [{ torch: flashStatus }]
        });

        document.getElementById("btnFlash").innerText =
            flashStatus ? "🔦 Flash OFF" : "🔦 Flash ON";

    } catch (err) {
        showNotif("Flash tidak didukung","error");
    }
}
    if (currentCameraTrack) {
        currentCameraTrack.applyConstraints({
            advanced: [{ torch: false }]
        }).catch(()=>{});
    }
}

function tambahManual(){
let input=document.getElementById("manualBarcode");
let barcode=input.value.trim();

if(barcode===""){

    efekErrorKuat();   // 🔥 tambahkan ini
    beep("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

    showNotif("❌ Data Kantong Kosong!","error");
    return;
}
prosesBarcode(barcode);
input.value="";
}

document.getElementById("manualBarcode")
.addEventListener("keypress",function(e){
if(e.key==="Enter") tambahManual();
});

let pendingBarcode = "";

// =========================
// POPUP BERAT
// =========================

function tampilPopupBerat(barcode){

pendingBarcode = barcode;

document.getElementById("popupBerat").style.display = "flex";

document.getElementById("popupBarcode").innerHTML =
"📦 " + barcode;

document.getElementById("inputBerat").value = "";

setTimeout(()=>{
document.getElementById("inputBerat").focus();
},200);

}

function tutupPopupBerat(){

document.getElementById("popupBerat").style.display = "none";

}

function simpanBerat(){

let berat =
document.getElementById("inputBerat").value;

if(berat === "" || Number(berat) <= 0){

showNotif("❌ Berat belum diisi","error");
return;

}

dataBerat[pendingBarcode] = berat + " Kg";

scannedBarcodes.push(pendingBarcode);

tambahData(pendingBarcode);

updateScanCounter();

beep("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

showNotif("✅ Barcode & berat berhasil ditambahkan","success");

tutupPopupBerat();

}

function tambahData(barcode){

let table=document.getElementById("tabelData");

let row=table.insertRow();

// NO
row.insertCell(0).innerHTML=scannedBarcodes.length;

// BARCODE
row.insertCell(1).innerHTML=barcode;

// BERAT
row.insertCell(2).innerHTML=
dataBerat[barcode] || "-";

// HAPUS
row.insertCell(3).innerHTML=
`<button class="btn-danger" onclick="hapusBaris(this,'${barcode}')">X</button>`;

document.getElementById("total").innerText=scannedBarcodes.length;

}

function hapusBaris(btn,barcode){

if(!confirm("⚠️ PERINGATAN!\n\nData kantong akan dihapus permanen.\nLanjutkan?")){
    return;
}
btn.parentNode.parentNode.remove();
scannedBarcodes=scannedBarcodes.filter(b=>b!==barcode);
updateNomor();
updateScanCounter();

simpanLocal(); // agar firebase ikut update
}

function updateNomor(){
let rows=document.querySelectorAll("#tabelData tr");
for(let i=1;i<rows.length;i++){
rows[i].cells[0].innerText=i;
}
document.getElementById("total").innerText=rows.length-1;
}

function hapusSemua(){

updateScanCounter();

scannedBarcodes = [];

// 🔥 TAMBAH INI
dataBerat = {};

document.getElementById("tabelData").innerHTML=
`<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat</th>
<th>Hapus</th>
</tr>`;

document.getElementById("total").innerText=0;
}

const canvas=document.getElementById("signature");
const ctx=canvas.getContext("2d");
let drawing=false;

canvas.onmousedown=()=>drawing=true;
canvas.onmouseup=()=>drawing=false;
canvas.onmousemove=(e)=>{
if(!drawing) return;
ctx.lineWidth=2;
ctx.lineCap="round";
ctx.strokeStyle="black";
ctx.lineTo(e.offsetX,e.offsetY);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(e.offsetX,e.offsetY);
};

function clearSignature(){
ctx.clearRect(0,0,canvas.width,canvas.height);
}

function generateNomorDokumen(){
let d=new Date();
return "STK-ESP-POSIND/"+d.getFullYear()+
("0"+(d.getMonth()+1)).slice(-2)+
("0"+d.getDate()).slice(-2)+
"/"+Math.floor(Math.random()*1000);
}

/* PRINT PDF SUPER PADAT PREMIUM - FONT PALING BESAR TANPA TAMBAH HALAMAN */
function printPDF(){

    if(scannedBarcodes.length === 0){
        alert("BELUM ADA DATA KANTONG KIMBEK !!!!!");
        return;
    }

    const tanggal  = document.getElementById("tanggal").value;
    const penerima = document.getElementById("penerima").value;
    const penyerah = document.getElementById("penyerah").value;
    const nomor    = generateNomorDokumen();
    const signatureImage = canvas.toDataURL("image/png");

    const qrData = `
SERAH TERIMA KONTONG RETUR ESP ➜ POSIND

Nomor Dokumen : ${nomor}
Tanggal        : ${tanggal}
Nama Penerima  : ${penerima}
Nama Penyerah  : ${penyerah}
Total Kantong  : ${scannedBarcodes.length} Yang Di Serahkan Ke POSIND
`;

    QRCode.toDataURL(qrData, function(err, qrUrl){

        const win = window.open("", "", "width=900,height=1200");

        const perColumn = 35;
        const perPage   = 70;
        const totalPages = Math.ceil(scannedBarcodes.length / perPage);

        function buildTable(data, startIndex){
            let html = `
            <table>
            <tr><th style="width:20%">No</th><th style="width:80%">KANTONG</th></tr>`;

            data.forEach((barcode, i)=>{
                html += `
                <tr>
                    <td>${startIndex + i + 1}</td>
                    <td>${barcode}</td>
                </tr>`;
            });

            for(let i=data.length; i<perColumn; i++){
                html += `<tr><td>&nbsp;</td><td></td></tr>`;
            }

            html += `</table>`;
            return html;
        }

        win.document.write(`
        <html>
        <head>
        <title>Serah Terima Kantong</title>
        <style>
        @page { size:A4 portrait; margin:0mm; }
        body{ font-family:Arial; margin:5px; }
        .page{ padding:15px; page-break-after:always; }
        .judul{ text-align:center; font-size:19px; font-weight:bold; margin:6px 0; }
        .info{ font-size:13px; line-height:1.4; }
        .flex-table{ display:flex; gap:8px; margin-top:6px; }
        table{ width:50%; border-collapse:collapse; font-size:13px; }
        th{ background:#000; color:#fff; font-size:14px; }
        th,td{ border:1px solid black; padding:3px; text-align:center; }
        .footer{ margin-top:12px; display:flex; justify-content:space-between; align-items:flex-end; }
        .box-ttd{ width:30%; text-align:center; font-size:13px; }
        </style>
        </head>
        <body>
        `);

        for(let p=0; p<totalPages; p++){

            const start = p * perPage;
            const pageData = scannedBarcodes.slice(start, start + perPage);

            const leftData  = pageData.slice(0, perColumn);
            const rightData = pageData.slice(perColumn, perPage);

            win.document.write(`
            <div class="page">

            <div style="display:flex; align-items:center; justify-content:space-between;">
                <img src="Logo PosIND.png" width="55">
                <div class="judul">SERAH TERIMA KONTONG RETUR ESP ➜ POSIND</div>
                <img src="ESP.png" width="80">
            </div>

            <div class="info">
                <div><strong>Nomor Dokumen :</strong> ${nomor}</div>
                <div><strong>Tanggal :</strong> ${tanggal}</div>
                <div><strong>Nama Penerima :</strong> ${penerima}</div>
                <div><strong>Nama Penyerah :</strong> ${penyerah}</div>
            </div>

            <div class="flex-table">
                ${buildTable(leftData, start)}
                ${buildTable(rightData, start + perColumn)}
            </div>

            ${p === totalPages-1 ? `
            <div class="footer">
                <div>
                    <strong>TOTAL :</strong><br>
                    <span style="font-size:20px;font-weight:900;">
                    ${scannedBarcodes.length} KANTONG
                    </span><br>
                    <span style="font-weight:800;">DI SERAHKAN KE POSIND</span>
                </div>

                <div class="box-ttd">
                    Penerima<br><br>
                    <img src="${signatureImage}" width="110"><br>
                    (${penerima})
                </div>

                <div class="box-ttd">
                    Penyerah<br><br><br><br>
                    _________________________<br>
                    (${penyerah})
                </div>

                <div class="box-ttd">
                    QR<br>
                    <img src="${qrUrl}" width="95">
                </div>
            </div>
            ` : ``}

            </div>
            `);
        }

        win.document.write(`</body></html>`);
        win.document.close();
        win.document.title = "STK_ESP KE POSIND_" + getTanggalJamFile() + ".pdf";
        win.print();
    });
}

function exportExcel(){

    if(scannedBarcodes.length === 0){
        alert("BELUM ADA DATA KANTONG KIMBEK !!!!!!!");
        return;
    }

    const tanggal  = document.getElementById("tanggal").value;
    const penerima = document.getElementById("penerima").value;
    const penyerah = document.getElementById("penyerah").value;
    const nomor    = generateNomorDokumen();

    const wb = XLSX.utils.book_new();
    const ws = {};

    let row = 1;

    function setCell(r,c,value){
        ws[XLSX.utils.encode_cell({r:r-1,c:c-1})] = { v:value, t:"s" };
    }

    // ===== HEADER =====
    setCell(row++,1,"SERAH TERIMA KONTONG RETUR ESP ➜ POSIND");
    row++;

    setCell(row++,1,"Nomor Dokumen : "+nomor);
    setCell(row++,1,"Tanggal : "+tanggal);
    setCell(row++,1,"Nama Penerima : "+penerima);
    setCell(row++,1,"Nama Penyerah : "+penyerah);
    setCell(row++,1,"Total Kantong : "+scannedBarcodes.length+" ( Yang Di Serahkan Ke POSIND )");

    row+=2;

    // ===== TABLE HEADER =====
    setCell(row,1,"No");
    setCell(row,2,"KANTONG");
    setCell(row,4,"No");
    setCell(row,5,"KANTONG");
    row++;

   const perColumn = 70;
const totalRows = Math.ceil(scannedBarcodes.length / 2);

for(let i=0;i<totalRows;i++){

    let leftIndex  = i;
    let rightIndex = i + totalRows;

    setCell(row,1, scannedBarcodes[leftIndex] ? String(leftIndex+1) : "");
    setCell(row,2, scannedBarcodes[leftIndex] || "");

    setCell(row,4, scannedBarcodes[rightIndex] ? String(rightIndex+1) : "");
    setCell(row,5, scannedBarcodes[rightIndex] || "");

    row++;
}

    row+=2;

    setCell(row,1,"Penerima");
    setCell(row,4,"Penyerah");
    row+=4;

    setCell(row,1,"("+penerima+")");
    setCell(row,4,"("+penyerah+")");

    ws["!ref"] = "A1:F"+row;
    ws["!cols"] = [
        {wch:6},{wch:35},{wch:5},
        {wch:6},{wch:35},{wch:5}
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Serah Terima");
    XLSX.writeFile(wb, "STK_ESP KE POSIND_" + getTanggalJamFile() + ".xlsx");
	simpanHistoryExport();
	loadHistoryList(); // refresh dropdown setelah simpan
}



/* ================================
   AUTO SAVE & LOAD (ANTI HILANG)
================================= */

// ===== SIMPAN KE LOCAL STORAGE =====
function simpanLocal(){

    let data = {
        tanggal: document.getElementById("tanggal").value,
        penerima: document.getElementById("penerima").value,
        penyerah: document.getElementById("penyerah").value,
        barcodes: scannedBarcodes,
        dataBerat: dataBerat // 🔥 simpan berat juga
    };

    database.ref("data_stk/global").set(data);
}

// ===== LOAD SAAT HALAMAN DIBUKA =====
window.addEventListener("load", function(){

 loadHistoryFirebase(); // ambil dari firebase
 loadHistoryList();     // 🔥 tampilkan ke dropdown langsung

    database.ref("data_stk/global").on("value", function(snapshot){

        let data = snapshot.val();
        if(!data) return;

        scannedBarcodes = data.barcodes || [];
		dataBerat = data.dataBerat || {};

        document.getElementById("tanggal").value = data.tanggal || "";
        document.getElementById("penerima").value = data.penerima || "";
        document.getElementById("penyerah").value = data.penyerah || "";

        let table = document.getElementById("tabelData");
        table.innerHTML = `
<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat</th>
<th>Hapus</th>
</tr>`;

        scannedBarcodes.forEach((barcode,index)=>{
            let row = table.insertRow();
            row.insertCell(0).innerHTML = index + 1;

// barcode
row.insertCell(1).innerHTML = barcode;

// berat
row.insertCell(2).innerHTML =
dataBerat[barcode] || "-";

// tombol hapus
row.insertCell(3).innerHTML =
`<button class="btn-danger" onclick="hapusBaris(this,'${barcode}')">X</button>`;
        });

        document.getElementById("total").innerText = scannedBarcodes.length;
        updateScanCounter();

    });

});

// ===== OTOMATIS SIMPAN SETIAP ADA PERUBAHAN =====
const originalTambahData = tambahData;
tambahData = function(barcode){
    originalTambahData(barcode);
    simpanLocal();
}

const originalHapusBaris = hapusBaris;
hapusBaris = function(btn,barcode){
    originalHapusBaris(btn,barcode);
    simpanLocal();
}

// Simpan fungsi asli
const originalHapusSemua = hapusSemua;

function tutupAlertAll(){
    document.getElementById("cyberAlertAll").style.display="none";
}

function hapusSemuaConfirm(){
    // panggil fungsi asli
    originalHapusSemua();

    // update Firebase / local storage
    simpanLocal();

    // sembunyikan popup
    tutupAlertAll();
}

// Override agar tampil popup dulu
hapusSemua = function(){
    // tampilkan popup HAPUS SEMUA
    document.getElementById("cyberAlertAll").style.display="flex";
};

// Simpan juga saat isi nama berubah
document.getElementById("penerima").addEventListener("input", simpanLocal);
document.getElementById("penyerah").addEventListener("input", simpanLocal);
document.getElementById("tanggal").addEventListener("change", simpanLocal);


function efekErrorKuat(){

    if(navigator.vibrate){
        navigator.vibrate([300,100,300,100,400]);
    }

    document.body.classList.add("error-shake");
    document.body.classList.add("error-flash");

    setTimeout(()=>{
        document.body.classList.remove("error-shake");
        document.body.classList.remove("error-flash");
    },1200);

}


let btnTarget;
let barcodeTarget;

function hapusBaris(btn,barcode){

btnTarget = btn;
barcodeTarget = barcode;

document.getElementById("cyberAlert").style.display="flex";
}

function tutupAlert(){
document.getElementById("cyberAlert").style.display="none";
}

function hapusConfirm(){

btnTarget.parentNode.parentNode.remove();
scannedBarcodes = scannedBarcodes.filter(b => b !== barcodeTarget);

// 🔥 hapus data berat juga
delete dataBerat[barcodeTarget];

updateNomor();
updateScanCounter();
simpanLocal();

tutupAlert();
}


// ================================
// 🔥 HISTORY EXPORT SYSTEM PRO
// ================================

// ===== SIMPAN HISTORY =====
function simpanHistoryExport(){

    let now = new Date();
    let key = "STK_" + getTanggalJamFile();

    let data = {
        tanggal: document.getElementById("tanggal").value,
        penerima: document.getElementById("penerima").value,
        penyerah: document.getElementById("penyerah").value,

        // 🔥 WAJIB TAMBAH INI
        dataBerat: dataBerat,

        barcodes: scannedBarcodes,
        created: now.getTime(),
        expired: now.getTime() + (7 * 24 * 60 * 60 * 1000)
    };

    // LOCAL
    localStorage.setItem(key, JSON.stringify(data));

    let list = JSON.parse(localStorage.getItem("history_stk")) || [];
    list.push(key);
    localStorage.setItem("history_stk", JSON.stringify(list));

    // FIREBASE
    backupFirebase(key, data);
}


// ===== BACKUP FIREBASE =====
function backupFirebase(key, data){
    database.ref("history_stk/" + key).set(data);
}


// ===== LOAD HISTORY LIST =====
function loadHistoryList(){

    let list = JSON.parse(localStorage.getItem("history_stk")) || [];
    let select = document.getElementById("historySelect");

    if(!select) return;

    select.innerHTML = `<option value="">-- PILIH DATA HISTORY --</option>`;

    let newList = [];

    list.forEach(key => {

        let data = JSON.parse(localStorage.getItem(key));
        if(!data) return;

        // hapus jika expired
        if(Date.now() > data.expired){
            localStorage.removeItem(key);
            return;
        }

        newList.push(key);

        let option = document.createElement("option");
        option.value = key;

        // format tampil lebih rapi
        option.textContent = key.replace("STK_","").replace("_"," | ");

        select.appendChild(option);
    });

    localStorage.setItem("history_stk", JSON.stringify(newList));
}


// ===== LOAD DARI FIREBASE =====
function loadHistoryFirebase(){

    database.ref("history_stk").once("value", function(snapshot){

        let data = snapshot.val();
        if(!data) return;

        Object.keys(data).forEach(key => {

            let item = data[key];

            if(Date.now() > item.expired) return;

            localStorage.setItem(key, JSON.stringify(item));

            let list = JSON.parse(localStorage.getItem("history_stk")) || [];

            if(!list.includes(key)){
                list.push(key);
                localStorage.setItem("history_stk", JSON.stringify(list));
            }

        });

        loadHistoryList();
    });
}


// ===== LOAD DATA TERPILIH =====
function loadDataHistory(){

    let key = document.getElementById("historySelect").value;
    if(!key) return;

    let data = JSON.parse(localStorage.getItem(key));
    if(!data) return;

    scannedBarcodes = data.barcodes || [];
	dataBerat = data.dataBerat || {};

    document.getElementById("tanggal").value = data.tanggal;
    document.getElementById("penerima").value = data.penerima;
    document.getElementById("penyerah").value = data.penyerah;

    let table = document.getElementById("tabelData");
    table.innerHTML = `
<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat</th>
<th>Hapus</th>
</tr>`;

    scannedBarcodes.forEach((barcode,index)=>{
        let row = table.insertRow();
        row.insertCell(0).innerHTML = index + 1;

// barcode
row.insertCell(1).innerHTML = barcode;

// berat
row.insertCell(2).innerHTML =
dataBerat[barcode] || "-";

// tombol hapus
row.insertCell(3).innerHTML =
`<button class="btn-danger" onclick="hapusBaris(this,'${barcode}')">X</button>`;
    });

    document.getElementById("total").innerText = scannedBarcodes.length;
    updateScanCounter();

    showNotif("📂 Data berhasil dipanggil","success");
}


// ===== PREVIEW =====
function previewHistory(){

    let key = document.getElementById("historySelect").value;
    if(!key) return;

    let data = JSON.parse(localStorage.getItem(key));
    if(!data) return;

    let preview = `
    📅 ${data.tanggal}<br>
    👤 ${data.penerima}<br>
    📦 ${data.barcodes.length} kantong
    `;

    document.getElementById("previewBox").innerHTML = preview;
}


// ===== CARI (PAKAI TOMBOL) =====
function cariHistory(){

    let input = document.getElementById("searchHistory").value.toLowerCase();
    let list = JSON.parse(localStorage.getItem("history_stk")) || [];
    let select = document.getElementById("historySelect");

    select.innerHTML = `<option value="">-- PILIH DATA HISTORY --</option>`;

    let ketemu = false;

    list.forEach(key => {

        let data = JSON.parse(localStorage.getItem(key));
        if(!data) return;

        let textGabung = (data.tanggal + " " + data.penerima + " " + data.penyerah).toLowerCase();

        if(textGabung.includes(input)){

            let option = document.createElement("option");
            option.value = key;
            option.textContent = key.replace("STK_","").replace("_"," | ");

            select.appendChild(option);
            ketemu = true;
        }

    });

    if(!ketemu){
        showNotif("❌ Data tidak ditemukan","error");
    }else{
        showNotif("🔍 Data ditemukan","success");
    }
}


// ===== RESET =====
function resetHistory(){

    document.getElementById("searchHistory").value = "";

    loadHistoryList(); // reload ulang semua data

    showNotif("🔄 Reset pencarian","success");
}

let selectedHistoryKey = null;

function hapusHistory(){

    let key = document.getElementById("historySelect").value;

    if(!key){
        showNotif("❌ Pilih data dulu","error");
        return;
    }

    selectedHistoryKey = key;

    // tampilkan popup password
    document.getElementById("passwordAlert").style.display = "flex";

    // reset input
    document.getElementById("inputPassword").value = "";
}

function tutupPassword(){
    document.getElementById("passwordAlert").style.display = "none";
}

function cekPassword(){

    const password = document.getElementById("inputPassword").value;

    // 🔐 GANTI PASSWORD DI SINI
    const PASSWORD_BENAR = "Di2tboit";

    if(password !== PASSWORD_BENAR){

        efekErrorKuat();

        beep("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");

        showNotif("❌ PASSWORD SALAH","error");

        return;
    }
	
    // kalau benar → hapus data
    let key = selectedHistoryKey;

    localStorage.removeItem(key);

    let list = JSON.parse(localStorage.getItem("history_stk")) || [];
    list = list.filter(k => k !== key);
    localStorage.setItem("history_stk", JSON.stringify(list));

    database.ref("history_stk/" + key).remove();

    loadHistoryList();
    document.getElementById("previewBox").innerHTML = "";

    tutupPassword();

    showNotif("🗑️ History berhasil dihapus","success");
}


document.getElementById("inputPassword")
.addEventListener("keypress", function(e){
    if(e.key === "Enter"){
        cekPassword();
    }
});


/* ===== ANTI INSPECT ===== */

document.addEventListener('contextmenu', function(e){
    e.preventDefault();
});

document.onkeydown = function(e){

    // F12
    if(e.keyCode == 123){
        return false;
    }

    // CTRL + SHIFT + I
    if(e.ctrlKey && e.shiftKey && e.keyCode == 73){
        return false;
    }

    // CTRL + SHIFT + J
    if(e.ctrlKey && e.shiftKey && e.keyCode == 74){
        return false;
    }

    // CTRL + U
    if(e.ctrlKey && e.keyCode == 85){
        return false;
    }

    // CTRL + SHIFT + C
    if(e.ctrlKey && e.shiftKey && e.keyCode == 67){
        return false;
    }

};

document.onselectstart = function(){
return false;
};

document.oncopy = function(){
return false;
};

(function(){

function detectDevTools(){

    const start = new Date();

    debugger;

    const end = new Date();

    if(end - start > 100){

        document.body.innerHTML =
        "<h1 style='color:red;text-align:center;margin-top:100px;'>SECURITY BLOCKED</h1>";

    }

}

setInterval(detectDevTools,1000);

})();

// ===== AUTO CLEAN MEMORY =====

setInterval(()=>{

if(scannedBarcodes.length > 2000){

console.log("Optimasi memory aktif");

}

},60000);

// ==============================
// EXPORT EXCEL BERAT
// ==============================

function exportExcelBerat(){

if(scannedBarcodes.length === 0){
    alert("BELUM ADA DATA");
    return;
}

const wb = XLSX.utils.book_new();

let data = [];

scannedBarcodes.forEach((barcode,index)=>{

    data.push({
        NO: index + 1,
        KANTONG: barcode,
        "BERAT / KG": parseFloat(dataBerat[barcode]) || 0
    });

});

const ws = XLSX.utils.json_to_sheet(data);

// ===== LEBAR KOLOM =====
ws["!cols"] = [
    {wch:10},
    {wch:35},
    {wch:15}
];

// ===== STYLE HEADER =====
const headerCells = ["A1","B1","C1"];

headerCells.forEach(cell => {

    if(ws[cell]){

        ws[cell].s = {

            font:{
                bold:true,
                sz:12
            },

            alignment:{
                horizontal:"center",
                vertical:"center"
            }

        };

    }

});

// ===== STYLE KOLOM BERAT =====
const range = XLSX.utils.decode_range(ws['!ref']);

for(let R = 1; R <= range.e.r; ++R){

    const cellAddress = XLSX.utils.encode_cell({
        r:R,
        c:2
    });

    if(ws[cellAddress]){

        ws[cellAddress].s = {

            font:{
                bold:true,
                sz:14
            },

            alignment:{
                horizontal:"center",
                vertical:"center"
            },

            border:{
                top:{style:"thin"},
                bottom:{style:"thin"},
                left:{style:"thin"},
                right:{style:"thin"}
            }

        };

    }

}

// ===== STYLE KOLOM NO =====
for(let R = 1; R <= range.e.r; ++R){

    const noCell = XLSX.utils.encode_cell({
        r:R,
        c:0
    });

    if(ws[noCell]){

        ws[noCell].s = {

            alignment:{
                horizontal:"center",
                vertical:"center"
            }

        };

    }

}

XLSX.utils.book_append_sheet(wb, ws, "INBOUND BERAT");

XLSX.writeFile(
    wb,
    "INBOUND_BERAT_" + getTanggalJamFile() + ".xlsx"
);

showNotif("✅ Export INBOUND BERAT berhasil","success");

}


