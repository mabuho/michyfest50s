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
            
            google.script.run
                .withSuccessHandler(handleSuccess)
                .withFailureHandler(handleFailure)
                .processQRCode(code.data);
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
        timeOut = 10000;
    }
    setTimeout(() => {
        showResult('Esperando escaneo...', 'pending');
        scanning = false;
    }, timeOut);
}

function handleFailure(error) {
    loadingOverlay.classList.add('hidden');
        showResult('Error de conexión. Intenta de nuevo.', 'error');
        console.error(error);
    setTimeout(() => {
        showResult('Esperando escaneo...', 'pending');
        scanning = false;
    }, timeOut);
}

startScanner();