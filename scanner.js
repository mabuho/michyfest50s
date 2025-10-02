const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw9RFSdxfhYWiVzLU-LQug2D_VkP5z0xu_NnRpr8A9GwQGXN7Lqit5CcduPr8PnH_YO/exec";
const video = document.getElementById('scanner-video');
const resultBox = document.getElementById('result-box');
const loadingOverlay = document.getElementById('loading-overlay');
let scanning = false; 

function showResult(message, type) {
    resultBox.textContent = message;
    resultBox.className = `result-box ${type}`;
}

async function startScanner() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        video.setAttribute('playsinline', true);
        video.play();
        requestAnimationFrame(tick);
    } catch (err) {
        showResult('Error: No se puede acceder a la cámara. Revisa los permisos.', 'error');
        console.error("Error al acceder a la cámara:", err);
    }
}

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
    if (!scanning) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(
            imageData.data,
            imageData.width,
            imageData.height, {
                inversionAttempts: "dontInvert",
            }
        );

        if (code !== null && code.data !== '') {
            scanning = true;

            showResult('');
            loadingOverlay.classList.remove('hidden');

            const URL = `${WEB_APP_URL}?qrData=${encodeURIComponent(code.data)}`;
            
            fetch(URL)
              .then(response => {
                  if (!response.ok) {
                      throw new Error(`Error HTTP: ${response.status}`);
                  }
                  return response.json(); // Esperamos una respuesta JSON de Apps Script
              })
              .then(data => {
                  // data.status y data.message vienen de Apps Script (función doGet)
                  handleSuccess(data); 
              })
              .catch(error => {
                  handleFailure(error);
              });
        }
    }
    }
    requestAnimationFrame(tick);
}

function handleSuccess(result) {
    loadingOverlay.classList.add('hidden');
    let timeOut = 5000;
    
    if (result.status === 'success') {
        showResult(result.message, 'success');
    } else {
        showResult(result.message, 'error');
        timeOut = 7000;
    }
    setTimeout(() => {
        showResult('Esperando escaneo...', 'pending');
        scanning = false;
    }, timeOut);
}

function handleFailure(error) {
    loadingOverlay.classList.add('hidden');
        showResult('Error de conexión. Intenta de nuevo.', 'error');
        console.error('Error de Fetch/Servidor: ' + error);
    setTimeout(() => {
        showResult('Esperando escaneo...', 'pending');
        scanning = false;
    }, 5000);
}

startScanner();
